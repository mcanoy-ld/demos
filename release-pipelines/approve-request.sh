#!/bin/zsh

# LaunchDarkly Approval Request Script
# This script lists and approves LaunchDarkly approval requests

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

# Load environment variables from .env file if it exists
if [[ -f ".env" ]]; then
    # Source .env file, exporting variables
    set -a
    source .env 2>/dev/null || true
    set +a
fi

# Default values (can be overridden by .env file or command line)
ACTION="usage"
BASE_URL="${LAUNCHDARKLY_BASE_URL:-https://app.launchdarkly.com/api/v2}"
VERBOSE=false

# Default values from .env (can be overridden by command line)
DEFAULT_API_KEY="${LAUNCHDARKLY_API_KEY:-}"
DEFAULT_PROJECT_KEY="${LAUNCHDARKLY_PROJECT_KEY:-}"
DEFAULT_FLAG_KEY="${LAUNCHDARKLY_FLAG_KEY:-}"
DEFAULT_ENVIRONMENT="${LAUNCHDARKLY_ENVIRONMENT:-}"

# API endpoints
LIST_APPROVALS_API="${BASE_URL}/projects/PROJECT_KEY/flags/FLAG_KEY/environments/ENV_KEY/approval-requests"
APPROVE_API="${BASE_URL}/projects/PROJECT_KEY/flags/FLAG_KEY/environments/ENV_KEY/approval-requests/APPROVAL_ID/reviews"
APPLY_API="${BASE_URL}/projects/PROJECT_KEY/flags/FLAG_KEY/environments/ENV_KEY/approval-requests/APPROVAL_ID/apply"

# Function to show usage
usage() {
    cat << EOF
Usage: $0 --flag-key <flag-key> --api-key <api-key> --project-key <project-key> --env <environment> [options]

Manage LaunchDarkly approval requests.

Required (can be set via .env file or command line):
  --flag-key <key>      The feature flag key (or set LAUNCHDARKLY_FLAG_KEY in .env)
  --api-key <key>       Your LaunchDarkly API access token (or set LAUNCHDARKLY_API_KEY in .env)
  --project-key <key>   The LaunchDarkly project key (or set LAUNCHDARKLY_PROJECT_KEY in .env)
  --env <env>           The environment key (or set LAUNCHDARKLY_ENVIRONMENT in .env)

Actions (choose one):
  -l, --list            List approval requests for the flag
  -a, --approve         Approve an approval request (requires --id)
  --apply               Apply an approved request (requires --id)

Options:
  --id <id>             Approval request ID (required for approve/apply)
  --comment <text>      Comment for approval (default: "LGTM")
  --base-url <url>      LaunchDarkly API base URL (default: https://app.launchdarkly.com/api/v2)
  -v, --verbose         Print URLs being called for debugging
  -h, --help            Show this help message

Examples:
  # List approval requests
  $0 --flag-key release-widget-ui --api-key sdk-xxxxx --project-key my-project --env production --list

  # Approve a request
  $0 --flag-key release-widget-ui --api-key sdk-xxxxx --project-key my-project --env production --approve --id approval-123

  # Apply an approved request
  $0 --flag-key release-widget-ui --api-key sdk-xxxxx --project-key my-project --env production --apply --id approval-123
EOF
    exit 1
}

# Parse command line arguments (defaults from .env if not provided)
FLAG_KEY="${DEFAULT_FLAG_KEY}"
API_KEY="${DEFAULT_API_KEY}"
PROJECT_KEY="${DEFAULT_PROJECT_KEY}"
ENVIRONMENT="${DEFAULT_ENVIRONMENT}"
APPROVAL_ID=""
COMMENT="LGTM"

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
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --id)
            APPROVAL_ID="$2"
            shift 2
            ;;
        --comment)
            COMMENT="$2"
            shift 2
            ;;
        --base-url)
            BASE_URL="$2"
            shift 2
            ;;
        -l|--list)
            ACTION="list_approvals"
            shift
            ;;
        -a|--approve)
            ACTION="approve_request"
            shift
            ;;
        --apply)
            ACTION="apply_request"
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
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
    print_error "Flag key is required (set via --flag-key or LAUNCHDARKLY_FLAG_KEY in .env)"
    usage
fi

if [[ -z "$API_KEY" ]]; then
    print_error "API key is required (set via --api-key or LAUNCHDARKLY_API_KEY in .env)"
    usage
fi

if [[ -z "$PROJECT_KEY" ]]; then
    print_error "Project key is required (set via --project-key or LAUNCHDARKLY_PROJECT_KEY in .env)"
    usage
fi

if [[ -z "$ENVIRONMENT" ]]; then
    print_error "Environment is required (set via --env or LAUNCHDARKLY_ENVIRONMENT in .env)"
    usage
fi

# Function to make API requests
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local max_retries=${4:-3}
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
        # Extract JSON body by finding content between first { or [ and the HTTP status code
        # Remove all HTTP headers and status lines, keep only JSON body
        local body=$(echo "$response" | sed -e '/^HTTP\//d' -e '/^[A-Za-z-]*: /d' -e '/^$/d' | sed '$d')
        echo "$body"
        echo "$http_code"
        return 0
    done
}

# Function to list approval requests
list_approvals() {
    print_info "Listing approval requests for flag: ${FLAG_KEY}"
    print_info "Project: ${PROJECT_KEY}, Environment: ${ENVIRONMENT}"
    
    local endpoint=$(echo "$LIST_APPROVALS_API" | sed "s|PROJECT_KEY|${PROJECT_KEY}|g; s|FLAG_KEY|${FLAG_KEY}|g; s|ENV_KEY|${ENVIRONMENT}|g")
    local endpoint_path=$(echo "$endpoint" | sed "s|${BASE_URL}||")
    
    local response=$(api_request "GET" "$endpoint_path")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" -eq 200 ]]; then
        
        print_success "Found approval requests:"
        
        # Use jq to parse and display items
        if command -v jq &> /dev/null; then
            local item_count=$(echo "$body" | jq '.items | length' 2>/dev/null || echo "0")
            echo "Number of items: ${item_count}"
            echo ""
            
            # Iterate over items using jq
            echo "$body" | jq -r '.items[]? | 
                "ID: \(._id // "N/A")
Status: \(.status // "N/A")
Description: \(.description // "N/A")
---"'
        else
            # Fallback parsing without jq
            echo "$body" | grep -o '"items":\[.*\]' | head -1 | sed 's/"items":\[//; s/\]$//' | grep -o '{[^}]*}' | while read -r item; do
                if [[ -n "$item" ]]; then
                    local id=$(echo "$item" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
                    local status=$(echo "$item" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
                    local desc=$(echo "$item" | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
                    echo "ID: ${id}"
                    echo "Status: ${status}"
                    echo "Description: ${desc}"
                    echo "---"
                fi
            done
        fi
    elif [[ "$http_code" -eq 404 ]]; then
        print_info "No approval requests found for flag ${FLAG_KEY} in environment ${ENVIRONMENT}"
    else
        print_error "Failed to list approval requests. HTTP $http_code"
        echo "$body" >&2
        return 1
    fi
}

# Function to approve a request
approve_request() {
    if [[ -z "$APPROVAL_ID" ]]; then
        print_error "Approval ID is required. Use --id <approval-id>"
        return 1
    fi
    
    print_info "Approving request: ${APPROVAL_ID}"
    
    local endpoint=$(echo "$APPROVE_API" | sed "s|PROJECT_KEY|${PROJECT_KEY}|g; s|FLAG_KEY|${FLAG_KEY}|g; s|ENV_KEY|${ENVIRONMENT}|g; s|APPROVAL_ID|${APPROVAL_ID}|g")
    local endpoint_path=$(echo "$endpoint" | sed "s|${BASE_URL}||")
    
    local request_body=$(cat <<EOF
{
  "comment": "${COMMENT}",
  "kind": "approve"
}
EOF
)
    
    local response=$(api_request "POST" "$endpoint_path" "$request_body")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" -eq 200 ]]; then
        print_success "Approval successful"
        if command -v jq &> /dev/null; then
            echo "$body" | jq '.'
        else
            echo "$body"
        fi
    elif [[ "$http_code" -eq 400 ]]; then
        print_error "Approval unsuccessful (Bad Request)"
        if command -v jq &> /dev/null; then
            echo "$body" | jq -r '.message // .'
        else
            echo "$body"
        fi
        return 1
    elif [[ "$http_code" -eq 403 ]]; then
        print_error "Approval unsuccessful (Forbidden - check permissions)"
        if command -v jq &> /dev/null; then
            echo "$body" | jq -r '.message // .'
        else
            echo "$body"
        fi
        return 1
    else
        print_error "Approval unsuccessful. HTTP $http_code"
        echo "$body" >&2
        return 1
    fi
}

# Function to apply an approved request
apply_request() {
    if [[ -z "$APPROVAL_ID" ]]; then
        print_error "Approval ID is required. Use --id <approval-id>"
        return 1
    fi
    
    print_info "Applying approved request: ${APPROVAL_ID}"
    
    local endpoint=$(echo "$APPLY_API" | sed "s|PROJECT_KEY|${PROJECT_KEY}|g; s|FLAG_KEY|${FLAG_KEY}|g; s|ENV_KEY|${ENVIRONMENT}|g; s|APPROVAL_ID|${APPROVAL_ID}|g")
    local endpoint_path=$(echo "$endpoint" | sed "s|${BASE_URL}||")
    
    local request_body=$(cat <<EOF
{
  "comment": "${COMMENT}",
  "kind": "approve"
}
EOF
)
    
    local response=$(api_request "POST" "$endpoint_path" "$request_body")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" -eq 200 ]]; then
        print_success "Apply successful"
        if command -v jq &> /dev/null; then
            echo "$body" | jq '.'
        else
            echo "$body"
        fi
    elif [[ "$http_code" -eq 400 ]]; then
        print_error "Apply unsuccessful (Bad Request)"
        if command -v jq &> /dev/null; then
            echo "$body" | jq -r '.message // .'
        else
            echo "$body"
        fi
        return 1
    elif [[ "$http_code" -eq 403 ]]; then
        print_error "Apply unsuccessful (Forbidden - check permissions)"
        if command -v jq &> /dev/null; then
            echo "$body" | jq -r '.message // .'
        else
            echo "$body"
        fi
        return 1
    else
        print_error "Apply unsuccessful. HTTP $http_code"
        echo "$body" >&2
        return 1
    fi
}

# Execute the requested action
case "$ACTION" in
    list_approvals)
        list_approvals
        ;;
    approve_request)
        approve_request
        ;;
    apply_request)
        apply_request
        ;;
    usage)
        usage
        ;;
    *)
        print_error "Unknown action: $ACTION"
        usage
        ;;
esac

