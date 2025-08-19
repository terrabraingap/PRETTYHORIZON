
export const PITY_MAX_N = 1500;
export const PITY_MAX_EXPECTED_PULLS = 5000;
export const TARGET_PROBS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99];

export async function calculate(params) {
    if (params.usePity) {
        return calculateWithPity(params);
    } else {
        return calculateBinomial(params);
    }
}

function calculateWithPity(params) {
    const { p, n, k, m } = params;

    if (n > PITY_MAX_N) {
        throw new Error(`천장 시스템 계산은 정확도를 위해 ${PITY_MAX_N}회 이하의 시도에서만 지원됩니다.`);
    }

    let dp_dist = new Array(n + 1).fill(0).map(() => new Array(m).fill(0));
    dp_dist[0][0] = 1;

    for (let i = 0; i < n; i++) {
        const next_dp = new Array(i + 2).fill(0).map(() => new Array(m).fill(0));
        for (let current_k = 0; current_k <= i; current_k++) {
            for (let s = 0; s < m; s++) {
                if (dp_dist[current_k][s] === 0) continue;

                if (s === m - 1) {
                    if (current_k + 1 <= n) {
                        next_dp[current_k + 1][0] += dp_dist[current_k][s];
                    }
                } else {
                    if (current_k + 1 <= n) {
                         next_dp[current_k + 1][0] += dp_dist[current_k][s] * p;
                    }
                    if (s + 1 < m) {
                        next_dp[current_k][s + 1] += dp_dist[current_k][s] * (1 - p);
                    }
                }
            }
        }
        dp_dist = next_dp;
    }

    const probExactly = new Array(n + 1).fill(0);
    for (let current_k = 0; current_k <= n; current_k++) {
        for (let s = 0; s < m; s++) {
            probExactly[current_k] += dp_dist[current_k]?.[s] ?? 0;
        }
    }
    
    let probGTE_k = 0;
    for (let i = k; i <= n; i++) {
        probGTE_k += probExactly[i];
    }

    const summary = { gte: probGTE_k, lt: 1 - probGTE_k };
    
    const distribution = [];
    let cumulative = probExactly.reduce((a, b) => a + b, 0);
    for (let i = 0; i <= n; i++) {
        distribution.push({ prob: probExactly[i], cumulative: cumulative });
        if (cumulative > 0) {
            cumulative -= probExactly[i];
        }
    }

    const expectedPulls = [];
    const maxPulls = Math.min(k * m, PITY_MAX_EXPECTED_PULLS);

    let dp_exp = new Array(k).fill(0).map(() => new Array(m).fill(0));
    dp_exp[0][0] = 1;
    
    let prob_gte_k_exp = 0;
    
    const cumulativeProbsForK = new Array(maxPulls + 1).fill(0);

    for (let i = 0; i < maxPulls; i++) {
        const next_dp = new Array(k).fill(0).map(() => new Array(m).fill(0));
        let next_prob_gte_k = prob_gte_k_exp;

        for (let j = 0; j < k; j++) {
            for (let s = 0; s < m; s++) {
                if (dp_exp[j][s] === 0) continue;
                const current_prob = dp_exp[j][s];

                if (s === m - 1) {
                    if (j + 1 < k) {
                        next_dp[j + 1][0] += current_prob;
                    } else {
                        next_prob_gte_k += current_prob;
                    }
                } else {
                    const success_prob = current_prob * p;
                    if (j + 1 < k) {
                        next_dp[j + 1][0] += success_prob;
                    } else {
                        next_prob_gte_k += success_prob;
                    }
                    
                    const failure_prob = current_prob * (1 - p);
                    if (s + 1 < m) {
                        next_dp[j][s + 1] += failure_prob;
                    }
                }
            }
        }
        
        dp_exp = next_dp;
        prob_gte_k_exp = next_prob_gte_k;
        cumulativeProbsForK[i + 1] = prob_gte_k_exp;
    }

    let searchIndex = k;
    for (const targetP of TARGET_PROBS) {
        let neededN = null;
        for (let j = searchIndex; j <= maxPulls; j++) {
            if (cumulativeProbsForK[j] >= targetP) {
                neededN = j;
                searchIndex = j;
                break;
            }
        }
        expectedPulls.push({ prob: targetP, pulls: neededN });
    }

    return { summary, distribution, expectedPulls };
}

function calculateBinomial(params) {
    const { p, n, k } = params;
    
    if (p >= 1) {
        const probGTE_k = k <= n ? 1 : 0;
        const summary = { gte: probGTE_k, lt: 1 - probGTE_k };
        const distribution = Array(n + 1).fill(0).map((_, i) => ({
            prob: i === n ? 1 : 0,
            cumulative: i <= n ? 1 : 0,
        }));
        const expectedPulls = TARGET_PROBS.map(prob => ({ prob, pulls: k }));
        return { summary, distribution, expectedPulls };
    }
    if (p <= 0) {
        const probGTE_k = k === 0 ? 1 : 0;
        const summary = { gte: probGTE_k, lt: 1 - probGTE_k };
        const distribution = Array(n + 1).fill(0).map((_, i) => ({
            prob: i === 0 ? 1 : 0,
            cumulative: 1,
        }));
        const expectedPulls = TARGET_PROBS.map(prob => ({ prob, pulls: k === 0 ? 0 : null }));
        return { summary, distribution, expectedPulls };
    }
    
    const lgammaCoeffs = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    const gLgamma = 7;
    
    function lgamma(z) {
        if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
        const x = z - 1;
        let a = lgammaCoeffs[0];
        const t = x + gLgamma + 0.5;
        for (let i = 1; i < lgammaCoeffs.length; i++) a += lgammaCoeffs[i] / (x + i);
        return (x + 0.5) * Math.log(t) - t + Math.log(Math.sqrt(2 * Math.PI) * a);
    }
    
    function logCombinations(n, k) {
        if (k < 0 || k > n) return -Infinity;
        return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
    }

    const logP = Math.log(p);
    const logOneMinusP = Math.log1p(-p);
    
    function logBinomialProb(k, n) {
        if (k < 0 || k > n) return -Infinity;
        return logCombinations(n, k) + k * logP + (n - k) * logOneMinusP;
    }
    
    function cumulativeBinomial(startK, numTrials) {
        if (startK > numTrials) return 0.0;
        if (startK <= 0) return 1.0;

        if (startK > numTrials / 2) {
            let sum = 0;
            for (let i = startK; i <= numTrials; i++) {
                sum += Math.exp(logBinomialProb(i, numTrials));
            }
            return sum;
        } else {
            let sumOfLower = 0;
            for (let i = 0; i < startK; i++) {
                sumOfLower += Math.exp(logBinomialProb(i, numTrials));
            }
            return 1.0 - sumOfLower;
        }
    }

    const probGTE_k = cumulativeBinomial(k, n);
    const summary = { gte: probGTE_k, lt: 1 - probGTE_k };

    const distribution = [];
    let cumulativeProb = 1.0;
    for (let i = 0; i <= n; i++) {
        const prob_i = Math.exp(logBinomialProb(i, n));
        distribution.push({ prob: prob_i, cumulative: cumulativeProb });
        if (cumulativeProb > 0) {
            cumulativeProb -= prob_i;
        }
    }

    const expectedPulls = [];
    for (const targetP of TARGET_PROBS) {
        let low = k, high = Math.max(k * 2, Math.ceil(k / p * 2)), neededN = null;

        while (cumulativeBinomial(k, high) < targetP) {
            low = high;
            high = Math.ceil(high * 1.5);
            if (high > 10_000_000) {
                high = -1;
                break;
            }
        }
        
        if (high !== -1) {
            let searchHigh = high;
            if (targetP > 0.9 && cumulativeBinomial(k, searchHigh) < targetP) {
                searchHigh = Math.ceil(searchHigh * 2);
            }

            for (let iter = 0; iter < 100; iter++) {
                if (low >= searchHigh) break;
                const mid = low + Math.floor((searchHigh - low) / 2);
                if (mid <= low) break; 
                if (cumulativeBinomial(k, mid) >= targetP) {
                    searchHigh = mid;
                } else {
                    low = mid;
                }
            }
            neededN = searchHigh;
        }
        expectedPulls.push({ prob: targetP, pulls: neededN });
    }

    return { summary, distribution, expectedPulls };
}