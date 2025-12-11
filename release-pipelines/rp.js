const ldcontexts = new Map();

const options = {
    application: {
        id: 'release-pipeline-demo',
        version: '1.0.1',
    }
}

const basicContext = {
    kind: 'user',
    key: 'basic-key',
    name: 'Basil',
    tier: 'Free'
  };

const alphaContext = {
    kind: 'user',
    key: 'alpha-key',
    name: 'Alfie',
    tier: 'QA'

  };

const betacontext = {
    kind: 'user',
    key: 'beta-key',
    name: 'Beto',
    tier: 'Beta'
  };

const enterprisecontext = {
    kind: 'user',
    key: 'enterprise-key',
    name: 'Enzo',
    tier: 'Enterprise'
  };

ldcontexts.set('dev', basicContext);
ldcontexts.set('qa', basicContext);
ldcontexts.set('int', basicContext);
ldcontexts.set('prod-alpha', alphaContext);
ldcontexts.set('prod-beta', betacontext);
ldcontexts.set('prod-enterprise', enterprisecontext);

/*
* Render based on env and target. Requires naming convention for inputs. Part of init
*/
function renderEnv(ldclient, env, target) {
    if (typeof flagKey === 'undefined' || !flagKey) {
        console.error('Error: flagKey is not defined. Please set flagKey in utils.js');
        return;
    }
    
    // Use variationDetail to get detailed evaluation information
    const detail = ldclient.variationDetail(flagKey, false);
    const flagValue = detail.value;
    const reason = detail.reason;
    
    // Log the evaluation details
    console.log(`[${env}-${target}] Flag: ${flagKey}`);
    console.log(`  Value: ${flagValue}`);
    console.log(detail);
    console.log(`  Reason: ${reason?.kind}`);
    
    if (reason?.kind === 'FALLTHROUGH') {
        console.log(`  Fallthrough variation: ${reason.variationIndex}`);
    } else if (reason?.kind === 'RULE_MATCH') {
        console.log(`  Matched rule index: ${reason.ruleIndex}`);
        console.log(`  Rule variation: ${reason.variationIndex}`);
    } else if (reason?.kind === 'TARGET_MATCH') {
        console.log(`  Matched target variation: ${reason.variationIndex}`);
    } else if (reason?.kind === 'OFF') {
        console.log(`  Flag is off, using offVariation: ${reason.variationIndex}`);
    } else if (reason?.kind === 'ERROR') {
        console.log(`  Error: ${reason.errorKind || 'Unknown error'}`);
    } else {
        console.log(`  Unknown reason`);
    }
    
    const checkbox = document.getElementById(`${env}-${target}`);
    checkbox.checked = flagValue;
    
    // Update panel active state for visual feedback
    const panel = checkbox.closest('.pipeline-panel');
    if (panel) {
        if (flagValue) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    }
}

function initLDClients(...inputEnvs) {
    inputEnvs.forEach(env => {
        console.log(`Initializing LaunchDarkly client for ${getClientSide(env)}`);
        if(env === 'prod') {
            ['alpha', 'beta', 'enterprise'].forEach(target => {
                const ldclient = LDClient.initialize(getClientSide(env), ldcontexts.get(`${env}-${target}`), options);
                addEvents(ldclient, env, target);
            });
        } else {
            const ldclient = LDClient.initialize(getClientSide(env), ldcontexts.get(env), options);
            addEvents(ldclient, env, 'any');
        }
    });
}

function addEvents(ldclient, env, target) {
    ldclient.on('failed', () => {  
        document.getElementById(`${env}-${target}`).innerHTML = `${env} ${target} SDK failed to initialize`
    });
    
    ldclient.on('ready', () => {
        renderEnv(ldclient, env, target);
    });

    ldclient.on('change', () => {
        renderEnv(ldclient, env, target);
    });
}

