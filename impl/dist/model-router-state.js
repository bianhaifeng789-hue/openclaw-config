import fs from 'node:fs';
import path from 'node:path';
const STATE_PATH = path.resolve(process.cwd(), 'memory/model-router-state.json');
function createFailureCounters() {
    return {
        timeout: 0,
        rateLimit: 0,
        serverError: 0,
        lastFailureAt: null,
    };
}
export function createInitialModelRouterState(primaryModel = 'openai/gpt-5.4', fallbackModel = 'bailian/glm-5') {
    return {
        primaryModel,
        fallbackModel,
        activeModel: primaryModel,
        failures: {
            [primaryModel]: createFailureCounters(),
            [fallbackModel]: createFailureCounters(),
        },
        lastSwitchAt: null,
        lastSwitchReason: null,
        degraded: false,
        cooldownUntil: null,
    };
}
export function ensureModelRouterStateFile(primaryModel, fallbackModel) {
    if (!fs.existsSync(STATE_PATH)) {
        const initial = createInitialModelRouterState(primaryModel, fallbackModel);
        fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
        fs.writeFileSync(STATE_PATH, JSON.stringify(initial, null, 2) + '\n', 'utf8');
        return initial;
    }
    return readModelRouterState(primaryModel, fallbackModel);
}
export function readModelRouterState(primaryModel, fallbackModel) {
    try {
        const raw = fs.readFileSync(STATE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.failures)
            parsed.failures = {};
        if (primaryModel && !parsed.primaryModel)
            parsed.primaryModel = primaryModel;
        if (fallbackModel && !parsed.fallbackModel)
            parsed.fallbackModel = fallbackModel;
        parsed.failures[parsed.primaryModel] ||= createFailureCounters();
        parsed.failures[parsed.fallbackModel] ||= createFailureCounters();
        return parsed;
    }
    catch {
        const initial = createInitialModelRouterState(primaryModel, fallbackModel);
        writeModelRouterState(initial);
        return initial;
    }
}
export function writeModelRouterState(state) {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}
//# sourceMappingURL=model-router-state.js.map