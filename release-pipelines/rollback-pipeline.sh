#!/bin/zsh

# LaunchDarkly Release Pipeline Rollback Script
# This script rolls back a release pipeline by:
# - Turning off the flag in all environments except dev
# - Deleting all targeting rules in all environments except dev
# - Keeping dev environment on with default rule set to true

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo "${RED}ERROR: $1${NC}" >&2
}

print_success() {
    echo "${GREEN}✓ $1${NC}"
}

print_info() {
    echo "${YELLOW}ℹ $1${NC}"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 --flag-key <flag-key> --api-key <api-key> [--project-key <project-key>] [--base-url <base-url>]

Rollback a release pipeline by turning off flags in all environments except dev.

Required:
  --flag-key <key>      The feature flag key to rollback
  --api-key <key>       Your LaunchDarkly API access token

Optional:
  --project-key <key>   The LaunchDarkly project key (default: reads from utils.js)
  --base-url <url>      LaunchDarkly API base URL (default: https://app.launchdarkly.com/api/v2)
  --dry-run             Show what would be done without making changes
  --verbose, -v         Print URLs being called for debugging
  --help                Show this help message

Example:
  $0 --flag-key release-widget-ui --api-key sdk-xxxxx
EOF
    exit 1
}

# Parse command line arguments
FLAG_KEY=""
API_KEY=""
PROJECT_KEY=""
BASE_URL="https://app.launchdarkly.com/api/v2"
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --flag-key)
            FLAG_KEY="$2"
            shift 2
            ;;
        --api-key)
            API_KEY="$2"
            shift 2
            ;;
        --project-key)
            PROJECT_KEY="$2"
            shift 2
            ;;
        --base-url)
            BASE_URL="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate required parameters
if [[ -z "$FLAG_KEY" ]]; then
    print_error "Flag key is required"
    usage
fi

if [[ -z "$API_KEY" ]]; then
    print_error "API key is required"
    usage
fi

# Try to get project key from utils.js if not provided
if [[ -z "$PROJECT_KEY" ]]; then
    if [[ -f "utils.js" ]]; then
        # Try to extract project key from utils.js (this is a best guess)
        # Since utils.js doesn't contain project key, we'll need it as a parameter
        print_info "Project key not found in utils.js. Please provide --project-key"
        usage
    else
        print_error "Project key is required (provide --project-key or ensure utils.js exists)"
        usage
    fi
fi

# Function to make API requests with rate limiting handling
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local max_retries=${4:-3}  # Default to 3 retries
    local retry_count=0
    
    local url="${BASE_URL}${endpoint}"
    
    while [[ $retry_count -le $max_retries ]]; do
        # Print URL if verbose mode is enabled
        if [[ "$VERBOSE" == true ]]; then
            if [[ $retry_count -gt 0 ]]; then
                print_info "[VERBOSE] Retry attempt ${retry_count}/${max_retries}: ${method} ${url}"
            else
                print_info "[VERBOSE] ${method} ${url}"
            fi
            if [[ -n "$data" ]]; then
                print_info "[VERBOSE] Request body: $data"
            fi
        fi
        
        # Make the request and capture both headers and body
        local response
        if [[ -n "$data" ]]; then
            response=$(curl -s -i -X "$method" "$url" \
                -H "Authorization: ${API_KEY}" \
                -H "Content-Type: application/json" \
                -H "LD-API-Version: beta" \
                -d "$data" \
                -w "\n%{http_code}")
        else
            response=$(curl -s -i -X "$method" "$url" \
                -H "Authorization: ${API_KEY}" \
                -H "LD-API-Version: beta" \
                -w "\n%{http_code}")
        fi
        
        # Extract HTTP status code (last line)
        local http_code=$(echo "$response" | tail -n1)
        
        # Check for rate limiting (429 Too Many Requests)
        if [[ "$http_code" -eq 429 ]]; then
            # Extract Retry-After header if present
            local retry_after=$(echo "$response" | grep -i "retry-after:" | cut -d' ' -f2 | tr -d '\r' | head -n1)
            
            if [[ -n "$retry_after" && "$retry_after" =~ ^[0-9]+$ ]]; then
                print_info "Rate limited. Waiting ${retry_after} seconds (as specified by Retry-After header)..."
                sleep "$retry_after"
            else
                # Exponential backoff: 2^retry_count seconds
                local wait_time=$((2 ** retry_count))
                print_info "Rate limited. Waiting ${wait_time} seconds before retry..."
                sleep "$wait_time"
            fi
            
            ((retry_count++))
            
            if [[ $retry_count -gt $max_retries ]]; then
                print_error "Max retries (${max_retries}) exceeded due to rate limiting"
                echo "$response"
                return 1
            fi
            
            continue
        fi
        
        # Return the response (without headers, just body + http_code)
        # Extract body (everything except headers and status code)
        local body=$(echo "$response" | sed '/^HTTP\/\|^[A-Za-z-]*: /d' | sed '$d')
        echo "$body"
        echo "$http_code"
        return 0
    done
}

# Function to get all environments
get_environments() {
    local response=$(api_request "GET" "/projects/${PROJECT_KEY}/environments")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        echo "$body" | grep -o '"key":"[^"]*"' | sed 's/"key":"\([^"]*\)"/\1/'
    else
        print_error "Failed to get environments. HTTP $http_code"
        echo "$body" >&2
        exit 1
    fi
}

# Function to get current flag configuration for an environment
# Note: We get the full flag and extract environment data, as direct env endpoint may not be available
get_flag_config() {
    local env_key=$1
    local response=$(api_request "GET" "/flags/${PROJECT_KEY}/${FLAG_KEY}")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        echo "$body"
    else
        print_error "Failed to get flag config for ${env_key}. HTTP $http_code"
        echo "$body" >&2
        return 1
    fi
}

# Function to update flag configuration
update_flag_config() {
    local env_key=$1
    local patch_data=$2
    
    if [[ "$DRY_RUN" == true ]]; then
        print_info "[DRY RUN] Would update ${env_key} with: $patch_data"
        return 0
    fi
    
    # LaunchDarkly API endpoint format
    # Format: PATCH /api/v2/flags/{projectKey}/{featureFlagKey}
    # See: https://launchdarkly.com/docs/api/feature-flags/patch-feature-flag
    # The patch data must be wrapped in a "patch" array and paths must include /environments/{envKey}/
    local response=$(api_request "PATCH" "/flags/${PROJECT_KEY}/${FLAG_KEY}" "$patch_data")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        return 0
    else
        print_error "Failed to update ${env_key}. HTTP $http_code"
        echo "$body" >&2
        return 1
    fi
}

# Function to rollback environment (turn off and clear rules)
rollback_environment() {
    local env_key=$1
    
    print_info "Rolling back ${env_key}..."
    
    # Create patch to turn off flag and remove all targeting rules
    # Paths must include /environments/{envKey}/ prefix per LaunchDarkly API docs
    # offVariation should be 0 when resetting rules
    local patch_data=$(cat <<EOF
{
  "patch": [
    {
      "op": "replace",
      "path": "/environments/${env_key}/on",
      "value": false
    },
    {
      "op": "replace",
      "path": "/environments/${env_key}/targets",
      "value": []
    },
    {
      "op": "replace",
      "path": "/environments/${env_key}/rules",
      "value": []
    },
    {
      "op": "replace",
      "path": "/environments/${env_key}/fallthrough",
      "value": {
        "variation": 1
      }
    },
    {
      "op": "replace",
      "path": "/environments/${env_key}/offVariation",
      "value": 1
    }
  ]
}
EOF
)
    
    if update_flag_config "$env_key" "$patch_data"; then
        print_success "Rolled back ${env_key}"
        return 0
    else
        return 1
    fi
}

# Function to set dev environment (turn on with default true)
setup_dev_environment() {
    local env_key=$1
    
    print_info "Setting up dev environment ${env_key}..."
    
    # Create patch to turn on flag with default variation as true (variation 0)
    # Paths must include /environments/{envKey}/ prefix per LaunchDarkly API docs
    # Based on flag structure: variation 0 = true (Available), variation 1 = false (Unavailable)
    # So fallthrough should be variation 0 for true
    # offVariation should be 0 when resetting rules
    local patch_data=$(cat <<EOF
{
  "patch": [
    {
      "op": "replace",
      "path": "/environments/${env_key}/on",
      "value": true
    },
    {
      "op": "replace",
      "path": "/environments/${env_key}/targets",
      "value": []
    },
    {
      "op": "replace",
      "path": "/environments/${env_key}/rules",
      "value": []
    },
    {
      "op": "replace",
      "path": "/environments/${env_key}/fallthrough",
      "value": {
        "variation": 0
      }
    },
    {
      "op": "replace",
      "path": "/environments/${env_key}/offVariation",
      "value": 0
    }
  ]
}
EOF
)
    
    if update_flag_config "$env_key" "$patch_data"; then
        print_success "Set up dev environment ${env_key} with default true"
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    print_info "Starting rollback for flag: ${FLAG_KEY}"
    print_info "Project: ${PROJECT_KEY}"
    
    if [[ "$DRY_RUN" == true ]]; then
        print_info "DRY RUN MODE - No changes will be made"
    fi
    
    # Verify flag exists at project level first
    print_info "Verifying flag exists in project..."
    local flag_check=$(api_request "GET" "/flags/${PROJECT_KEY}/${FLAG_KEY}")
    local flag_http_code=$(echo "$flag_check" | tail -n1)
    
    if [[ "$flag_http_code" -eq 404 ]]; then
        print_error "Flag '${FLAG_KEY}' does not exist in project '${PROJECT_KEY}'"
        print_info "Please verify the flag key and project key are correct."
        exit 1
    elif [[ "$flag_http_code" -lt 200 || "$flag_http_code" -ge 300 ]]; then
        print_error "Failed to verify flag. HTTP $flag_http_code"
        echo "$(echo "$flag_check" | sed '$d')" >&2
        exit 1
    fi
    
    print_success "Flag verified in project"
    
    # Get all environments
    print_info "Fetching environments..."
    local environments=($(get_environments))
    
    if [[ ${#environments[@]} -eq 0 ]]; then
        print_error "No environments found"
        exit 1
    fi
    
    print_success "Found ${#environments[@]} environment(s): ${environments[*]}"
    
    # Process each environment
    local dev_processed=false
    local errors=0
    for env in "${environments[@]}"; do
        # Normalize environment key to lowercase for comparison
        local env_lower=$(echo "$env" | tr '[:upper:]' '[:lower:]')
        
        if [[ "$env_lower" == "dev" ]]; then
            if ! setup_dev_environment "$env"; then
                ((errors++))
            fi
            dev_processed=true
        else
            if ! rollback_environment "$env"; then
                ((errors++))
            fi
        fi
    done
    
    # If dev wasn't found, warn user
    if [[ "$dev_processed" == false ]]; then
        print_error "Warning: 'dev' environment not found. All environments were rolled back."
    fi
    
    if [[ $errors -eq 0 ]]; then
        print_success "Rollback complete!"
    else
        print_error "Rollback completed with $errors error(s). See messages above."
        exit 1
    fi
}

# Run main function
main

