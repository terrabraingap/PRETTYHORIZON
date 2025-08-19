
import { calculate, PITY_MAX_N } from './calculator.js';

document.addEventListener('DOMContentLoaded', () => {
    const PRICE_SETTINGS_KEY = 'gachaSimPriceSettings_v3';
    const THEME_KEY = 'gachaSimTheme_v1';

    const defaultPriceSettings = {
        coinEfficiency: 200,
        quartzEfficiency: 2,
        confidentialCost: 200,
        confidentialCostCurrency: 'coin',
        standardCost: 150,
    };
    let currentPriceSettings;

    // --- Element Selectors ---
    const themeToggle = document.getElementById('theme-toggle');
    const showSimulatorBtn = document.getElementById('show-simulator-btn');
    const showAnalyzerBtn = document.getElementById('show-analyzer-btn');
    const showPriceSettingsBtn = document.getElementById('show-price-settings-btn');
    const simulatorSheet = document.getElementById('simulator-sheet');
    const analyzerSheet = document.getElementById('analyzer-sheet');
    const priceSettingsSheet = document.getElementById('price-settings-sheet');
    const recruitmentTypeSelect = document.getElementById('recruitment-type') as HTMLSelectElement;
    const winRateInput = document.getElementById('win-rate') as HTMLInputElement;
    const costPerPullInput = document.getElementById('cost-per-pull') as HTMLInputElement;
    const totalAttemptsInput = document.getElementById('total-attempts') as HTMLInputElement;
    const confidentialTicketsDisplay = document.getElementById('confidential-tickets-display');
    const attemptsWarning = document.getElementById('attempts-warning');
    const targetWinsInput = document.getElementById('target-wins') as HTMLInputElement;
    const targetWinsPresets = document.getElementById('target-wins-presets');
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
    const pityToggle = document.getElementById('pity-toggle') as HTMLInputElement;
    const pityInputWrapper = document.getElementById('pity-input-wrapper');
    const pityCountInput = document.getElementById('pity-count') as HTMLInputElement;
    const analyzerAttemptsInput = document.getElementById('analyzer-attempts') as HTMLInputElement;
    const analyzerWinsInput = document.getElementById('analyzer-wins') as HTMLInputElement;
    const analyzerProbInput = document.getElementById('analyzer-prob') as HTMLInputElement;
    const analyzeBtn = document.getElementById('analyze-btn') as HTMLButtonElement;
    const analyzerResultsArea = document.getElementById('analyzer-results-area');
    const analyzerLoader = document.getElementById('analyzer-loader');
    const analyzerChartContainer = document.getElementById('analyzer-chart-container');
    const analyzerChart = document.getElementById('analyzer-chart');
    const analyzerResultText = document.getElementById('analyzer-result-text');
    const analyzerAttemptsWarning = document.getElementById('analyzer-attempts-warning');
    const analyzerPityToggle = document.getElementById('analyzer-pity-toggle') as HTMLInputElement;
    const analyzerPityInputWrapper = document.getElementById('analyzer-pity-input-wrapper');
    const analyzerPityCountInput = document.getElementById('analyzer-pity-count') as HTMLInputElement;
    const coinEfficiencyPresets = document.getElementById('coin-efficiency-presets');
    const coinEfficiencyInput = document.getElementById('coin-efficiency') as HTMLInputElement;
    const quartzEfficiencyInput = document.getElementById('quartz-efficiency') as HTMLInputElement;
    const confidentialCostPresets = document.getElementById('confidential-cost-presets');
    const confidentialCostInput = document.getElementById('confidential-cost') as HTMLInputElement;
    const confidentialCostCurrencySelect = document.getElementById('confidential-cost-currency') as HTMLSelectElement;
    const standardCostInput = document.getElementById('standard-cost') as HTMLInputElement;
    const saveSettingsBtn = document.getElementById('save-settings-btn') as HTMLButtonElement;
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    const confidentialCostKrw = document.getElementById('confidential-cost-krw');
    const standardCostKrw = document.getElementById('standard-cost-krw');
    const resultsArea = document.getElementById('results-area');
    const loader = document.getElementById('loader');
    const summaryTitle = document.getElementById('summary-title');
    const distributionTitle = document.getElementById('distribution-title');
    const expectedPullsTitle = document.getElementById('expected-pulls-title');
    const summaryBody = document.getElementById('summary-body') as HTMLTableSectionElement;
    const distributionBody = document.getElementById('distribution-body') as HTMLTableSectionElement;
    const expectedPullsBody = document.getElementById('expected-pulls-body') as HTMLTableSectionElement;
    const executionTimeDiv = document.getElementById('execution-time');
    const toastContainer = document.getElementById('toast-container');

    // --- Helper Functions ---
    function showToast(message: string, type = 'success', duration = 3300) {
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconSvg = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>`
        };
        
        toast.innerHTML = `${iconSvg[type]} <span>${message}</span>`;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    const formatPercent = (n: number) => `${(n * 100).toFixed(4)}%`;
    const formatNumber = (n: number) => n.toLocaleString('ko-KR');

    function createProgressBar(percent: number, type: string) {
        const barContainer = document.createElement('div');
        barContainer.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = `progress-fill ${type}`;
        fill.style.width = `${Math.min(percent * 100, 100)}%`;
        barContainer.appendChild(fill);
        return barContainer;
    }
    
    function setTitles(nStr: string, kStr: string) {
        summaryTitle.textContent = `목표 달성 확률 (${nStr}회 시도)`;
        distributionTitle.textContent = `성공 횟수별 확률 분포 (${nStr}회 시도)`;
        expectedPullsTitle.textContent = `달성 확률 구간별 예상 비용`;
    }

    function clearResults() {
        summaryBody.innerHTML = '';
        distributionBody.innerHTML = '';
        expectedPullsBody.innerHTML = '';
        executionTimeDiv.textContent = '';
    }
    
    // --- Theme Management ---
    function applyTheme(theme: string) {
        const labelSpan = themeToggle.querySelector('span');
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (labelSpan) labelSpan.textContent = '라이트 모드';
        } else {
            document.body.classList.remove('dark-mode');
            if (labelSpan) labelSpan.textContent = '다크 모드';
        }
    }

    function handleThemeToggle() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    }

    function loadInitialTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const themeToApply = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        applyTheme(themeToApply);
    }

    // --- UI Logic ---
    function switchSheet(sheetToShow: string) {
        simulatorSheet.classList.add('hidden');
        analyzerSheet.classList.add('hidden');
        priceSettingsSheet.classList.add('hidden');

        showSimulatorBtn.classList.remove('active');
        showAnalyzerBtn.classList.remove('active');
        showPriceSettingsBtn.classList.remove('active');

        if (sheetToShow === 'simulator') {
            simulatorSheet.classList.remove('hidden');
            showSimulatorBtn.classList.add('active');
        } else if (sheetToShow === 'analyzer') {
            analyzerSheet.classList.remove('hidden');
            showAnalyzerBtn.classList.add('active');
        } else {
            priceSettingsSheet.classList.remove('hidden');
            showPriceSettingsBtn.classList.add('active');
        }
    }
    
    function populatePriceSettingsForm() {
        coinEfficiencyInput.value = currentPriceSettings.coinEfficiency.toString();
        quartzEfficiencyInput.value = currentPriceSettings.quartzEfficiency.toString();
        confidentialCostInput.value = currentPriceSettings.confidentialCost.toString();
        confidentialCostCurrencySelect.value = currentPriceSettings.confidentialCostCurrency;
        standardCostInput.value = currentPriceSettings.standardCost.toString();

        updateCoinPresetUI();
        updateConfidentialPresetUI();
    }

    function loadPriceSettings() {
        try {
            const savedSettings = localStorage.getItem(PRICE_SETTINGS_KEY);
            currentPriceSettings = savedSettings ? JSON.parse(savedSettings) : { ...defaultPriceSettings };
        } catch {
            currentPriceSettings = { ...defaultPriceSettings };
        }
        populatePriceSettingsForm();
        updateAllCosts();
    }

    function savePriceSettings() {
        const settings = {
            coinEfficiency: parseFloat(coinEfficiencyInput.value) || 100,
            quartzEfficiency: parseFloat(quartzEfficiencyInput.value) || 2,
            confidentialCost: parseFloat(confidentialCostInput.value) || 300,
            confidentialCostCurrency: confidentialCostCurrencySelect.value || 'coin',
            standardCost: parseInt(standardCostInput.value, 10) || 150,
        };

        currentPriceSettings = settings;
        localStorage.setItem(PRICE_SETTINGS_KEY, JSON.stringify(settings));
        showToast('설정이 저장되었습니다.', 'success');
        updateAllCosts();

        const originalText = saveSettingsBtn.innerHTML;
        saveSettingsBtn.innerHTML = `저장됨!`;
        saveSettingsBtn.disabled = true;
        setTimeout(() => {
            saveSettingsBtn.innerHTML = originalText;
            saveSettingsBtn.disabled = false;
        }, 2000);
    }

    function resetPriceSettings() {
        if (confirm('모든 가격 설정을 초기 기본값으로 되돌리시겠습니까?')) {
            currentPriceSettings = { ...defaultPriceSettings };
            localStorage.removeItem(PRICE_SETTINGS_KEY);
            populatePriceSettingsForm();
            updateAllCosts();
            showToast('설정이 초기화되었습니다.', 'info');
        }
    }
    
    function updateAllCosts() {
        const baseCoinKRW = 15;
        const coinEfficiency = parseFloat(coinEfficiencyInput.value) || currentPriceSettings.coinEfficiency;
        const quartzEfficiency = parseFloat(quartzEfficiencyInput.value) || currentPriceSettings.quartzEfficiency;
        const confidentialCostVal = parseFloat(confidentialCostInput.value) || currentPriceSettings.confidentialCost;
        const confidentialCurrency = confidentialCostCurrencySelect.value || currentPriceSettings.confidentialCostCurrency;
        const standardCostVal = parseInt(standardCostInput.value, 10) || currentPriceSettings.standardCost;

        const coinCost = baseCoinKRW / (coinEfficiency / 100);
        const quartzCostInCoins = 1 / quartzEfficiency;

        const confidentialKRW = (confidentialCurrency === 'coin')
            ? confidentialCostVal * coinCost
            : confidentialCostVal * quartzCostInCoins * coinCost;
        
        const standardKRW = standardCostVal * quartzCostInCoins * coinCost;
        
        confidentialCostKrw.textContent = `≈ ${formatNumber(Math.round(confidentialKRW))}원 / 1회`;
        standardCostKrw.textContent = `≈ ${formatNumber(Math.round(standardKRW))}원 / 1회`;

        const finalCost = (recruitmentTypeSelect.value === 'confidential') ? confidentialKRW : standardKRW;
        costPerPullInput.value = finalCost.toFixed(2);
    }

    function renderResults(results, price) {
        const { summary, distribution, expectedPulls } = results;
        const rowSuccess = summaryBody.insertRow();
        rowSuccess.innerHTML = `<td>목표 달성 (${targetWinsInput.value}회 이상)</td><td class="progress-cell"><div>${formatPercent(summary.gte)}</div></td>`;
        rowSuccess.cells[0].dataset.label = '결과';
        rowSuccess.cells[1].dataset.label = '달성 확률';
        rowSuccess.cells[1].appendChild(createProgressBar(summary.gte, 'cumulative'));
        
        const rowFail = summaryBody.insertRow();
        rowFail.innerHTML = `<td>목표 미달 (${parseInt(targetWinsInput.value, 10) - 1}회 이하)</td><td class="progress-cell"><div>${formatPercent(summary.lt)}</div></td>`;
        rowFail.cells[0].dataset.label = '결과';
        rowFail.cells[1].dataset.label = '달성 확률';
        rowFail.cells[1].appendChild(createProgressBar(summary.lt, 'cumulative'));

        const maxDisplayK = Math.min(parseInt(totalAttemptsInput.value, 10), Math.max(10, parseInt(targetWinsInput.value, 10) + 5));
        distribution.slice(0, maxDisplayK + 1).forEach((dist, i) => {
            const row = distributionBody.insertRow();
            row.innerHTML = `<td>${i}회</td>
                        <td class="progress-cell"><div>${formatPercent(dist.prob)}</div></td>
                        <td class="progress-cell"><div>${formatPercent(dist.cumulative)}</div></td>`;
            row.cells[0].dataset.label = '성공 횟수';
            row.cells[1].dataset.label = '정확히 N회';
            row.cells[2].dataset.label = 'N회 이상';
            row.cells[1].appendChild(createProgressBar(dist.prob, 'exact'));
            row.cells[2].appendChild(createProgressBar(dist.cumulative, 'cumulative'));
        });

        expectedPulls.forEach((pull) => {
            const row = expectedPullsBody.insertRow();
            if (pull.prob === 0.5) {
                row.classList.add('median-row');
            }
            if (pull.pulls !== null) {
                row.innerHTML = `<td>${pull.prob * 100}%</td><td>${formatNumber(pull.pulls)}회</td><td>${formatNumber(pull.pulls * price)}원</td>`;
                row.cells[0].dataset.label = '달성 확률';
                row.cells[1].dataset.label = '필요 뽑기 횟수';
                row.cells[2].dataset.label = '예상 비용';
            } else {
                row.innerHTML = `<td>${pull.prob * 100}%</td><td colspan="2">계산 불가 (매우 많은 시도 필요)</td>`;
                row.cells[0].dataset.label = '달성 확률';
                row.cells[1].dataset.label = '결과';
            }
        });
        
        if (pityToggle.checked) {
            const k = parseInt(targetWinsInput.value, 10);
            const pity = parseInt(pityCountInput.value, 10);
            const worstCasePulls = k * pity;
            const worstCaseCost = worstCasePulls * price;
            const worstCaseRow = expectedPullsBody.insertRow();
            worstCaseRow.innerHTML = `<td>100% (최악의 경우)</td><td>${formatNumber(worstCasePulls)}회</td><td>${formatNumber(worstCaseCost)}원</td>`;
            worstCaseRow.cells[0].dataset.label = '달성 확률';
            worstCaseRow.cells[1].dataset.label = '필요 뽑기 횟수';
            worstCaseRow.cells[2].dataset.label = '예상 비용';
        }
    }

    async function handleCalculate() {
        const winRate = parseFloat(winRateInput.value) / 100;
        const costPerPull = parseFloat(costPerPullInput.value);
        const totalAttempts = parseInt(totalAttemptsInput.value, 10);
        const targetWins = parseInt(targetWinsInput.value, 10);
        const usePity = pityToggle.checked;
        const pityCount = parseInt(pityCountInput.value, 10);

        if (isNaN(winRate) || isNaN(costPerPull) || isNaN(totalAttempts) || isNaN(targetWins) || winRate <= 0 || winRate > 1 || totalAttempts < 1 || targetWins < 1 || (usePity && (isNaN(pityCount) || pityCount < 2))) {
            showToast('모든 필드에 유효한 값을 입력해주세요.', 'error');
            return;
        }

        if (targetWins > totalAttempts) {
            showToast('목표 성공 횟수는 총 시도 횟수보다 클 수 없습니다.', 'error');
            return;
        }
        
        resultsArea.classList.add('hidden');
        loader.classList.remove('hidden');
        clearResults();
        
        await new Promise(resolve => setTimeout(resolve, 50));
        const startTime = performance.now();
        
        setTitles(formatNumber(totalAttempts), formatNumber(targetWins));
        
        try {
            const results = await calculate({
                p: winRate,
                n: totalAttempts,
                k: targetWins,
                m: pityCount,
                usePity: usePity,
            });
            renderResults(results, costPerPull);
        } catch (error) {
            console.error("Calculation Error: ", error);
            showToast(error.message || "분석 중 오류가 발생했습니다. 입력값을 확인해주세요.", 'error', 4000);
        }

        const endTime = performance.now();
        executionTimeDiv.textContent = `분석 시간: ${(endTime - startTime).toFixed(4)}ms`;
        
        loader.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    }

    async function handleAnalyze() {
        const attempts = parseInt(analyzerAttemptsInput.value, 10);
        const wins = parseInt(analyzerWinsInput.value, 10);
        const prob = parseFloat(analyzerProbInput.value) / 100;
        const usePity = analyzerPityToggle.checked;
        const pityCount = parseInt(analyzerPityCountInput.value, 10);

        if (isNaN(attempts) || isNaN(wins) || isNaN(prob) || attempts < 1 || wins < 0 || wins > attempts || prob <= 0 || prob >= 1 || (usePity && (isNaN(pityCount) || pityCount < 2))) {
            showToast('모든 필드에 유효한 값을 입력해주세요.', 'error');
            return;
        }
        
        analyzerResultsArea.classList.remove('hidden');
        analyzerLoader.classList.remove('hidden');
        analyzerChartContainer.classList.add('hidden');

        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const results = await calculate({
                p: prob,
                n: attempts,
                k: wins,
                m: pityCount,
                usePity: usePity,
            });
            renderAnalyzerResults(results, wins);
        } catch (error) {
            console.error("Analyzer Error: ", error);
            showToast(error.message || "분석 중 오류가 발생했습니다. 입력값을 확인해주세요.", 'error', 4000);
        }

        analyzerLoader.classList.add('hidden');
        analyzerChartContainer.classList.remove('hidden');
    }

    function renderAnalyzerResults(results, userWins: number) {
        const { distribution } = results;

        const percentileUpperBound = distribution[userWins]?.cumulative ?? 0;
        const percentileLowerBound = distribution[userWins + 1]?.cumulative ?? 0;

        const upperBoundText = (percentileUpperBound * 100).toFixed(2);
        const lowerBoundText = (percentileLowerBound * 100).toFixed(2);

        if (upperBoundText === lowerBoundText) {
             analyzerResultText.textContent = `사장님은 상위 ${upperBoundText}%의 운입니다.`;
        } else {
             analyzerResultText.textContent = `사장님의 운은 상위 ${lowerBoundText}% ~ ${upperBoundText}% 사이에 위치합니다.`;
        }

        analyzerChart.innerHTML = '';

        const chartRadius = 15;
        const start = Math.max(0, userWins - chartRadius);
        const end = Math.min(distribution.length - 1, userWins + chartRadius);
        
        const displayData = distribution.slice(start, end + 1);
        const maxProb = Math.max(...displayData.map(d => d.prob), 0);
        
        displayData.forEach((item, index) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            
            const height = maxProb > 0 ? (item.prob / maxProb) * 100 : 0;
            bar.style.height = `${height}%`;
            
            const currentWins = start + index;
            if (currentWins === userWins) {
                bar.classList.add('highlight');
            }

            bar.title = `성공 횟수: ${currentWins}회, 확률: ${formatPercent(item.prob)}`;
            analyzerChart.appendChild(bar);
        });
    }

    function updateTotalAttemptsDisplay() {
        const recruitmentType = recruitmentTypeSelect.value;
        const totalAttempts = parseInt(totalAttemptsInput.value, 10);

        if (recruitmentType === 'confidential' && !isNaN(totalAttempts) && totalAttempts > 0) {
            const tickets = totalAttempts * 20;
            confidentialTicketsDisplay.textContent = `기채권 ${formatNumber(tickets)}장`;
            confidentialTicketsDisplay.classList.remove('hidden');
        } else {
            confidentialTicketsDisplay.classList.add('hidden');
        }
    }

    function setupPitySystem(
        toggle: HTMLInputElement,
        wrapper: HTMLElement,
        countInput: HTMLInputElement,
        attemptsInput: HTMLInputElement,
        warningEl: HTMLElement,
        actionBtn: HTMLButtonElement,
        onAttemptsInputCallback?: () => void
    ) {
        function validateAttemptCount() {
            const usePity = toggle.checked;
            const totalAttempts = parseInt(attemptsInput.value, 10);

            if (usePity && !isNaN(totalAttempts) && totalAttempts > PITY_MAX_N) {
                warningEl.textContent = `천장 시스템 계산은 정확도를 위해 ${PITY_MAX_N}회 이하만 지원됩니다.`;
                warningEl.classList.remove('hidden');
                actionBtn.disabled = true;
            } else {
                warningEl.classList.add('hidden');
                actionBtn.disabled = false;
            }
        }

        function updatePityVisibility() {
            const isEnabled = toggle.checked;
            wrapper.classList.toggle('hidden', !isEnabled);
            countInput.disabled = !isEnabled;
            validateAttemptCount();
        }

        toggle.addEventListener('change', updatePityVisibility);
        attemptsInput.addEventListener('input', () => {
            validateAttemptCount();
            if (onAttemptsInputCallback) {
                onAttemptsInputCallback();
            }
        });
        
        updatePityVisibility();
    }

    function updateActivePresetButton(groupElement: HTMLElement, value: string, valueParser?: (button: HTMLButtonElement) => string) {
        const presets = groupElement.querySelectorAll('button');
        let matchingPreset = false;
        presets.forEach(button => {
            const buttonValue = valueParser ? valueParser(button) : button.dataset.value;
            if (buttonValue && buttonValue !== 'custom' && buttonValue === value) {
                button.classList.add('active-preset');
                matchingPreset = true;
            } else {
                button.classList.remove('active-preset');
            }
        });
        const customButton = groupElement.querySelector('button[data-value="custom"]');
        if (customButton) {
            customButton.classList.toggle('active-preset', !matchingPreset);
        }
    }

    const updateTargetWinsUI = () => updateActivePresetButton(targetWinsPresets, targetWinsInput.value);
    const updateCoinPresetUI = () => updateActivePresetButton(coinEfficiencyPresets, coinEfficiencyInput.value);
    const updateConfidentialPresetUI = () => {
        const currentValue = `${confidentialCostInput.value}-${confidentialCostCurrencySelect.value}`;
        updateActivePresetButton(confidentialCostPresets, currentValue);
    };

    // --- Event Listeners & Initial Setup ---
    themeToggle.addEventListener('click', handleThemeToggle);
    showSimulatorBtn.addEventListener('click', () => switchSheet('simulator'));
    showAnalyzerBtn.addEventListener('click', () => switchSheet('analyzer'));
    showPriceSettingsBtn.addEventListener('click', () => switchSheet('priceSettings'));
    saveSettingsBtn.addEventListener('click', savePriceSettings);
    resetSettingsBtn.addEventListener('click', resetPriceSettings);
    
    recruitmentTypeSelect.addEventListener('change', () => {
        updateAllCosts();
        updateTotalAttemptsDisplay();
    });

    totalAttemptsInput.addEventListener('input', updateTotalAttemptsDisplay);

    setupPitySystem(pityToggle, pityInputWrapper, pityCountInput, totalAttemptsInput, attemptsWarning, calculateBtn, updateTotalAttemptsDisplay);
    setupPitySystem(analyzerPityToggle, analyzerPityInputWrapper, analyzerPityCountInput, analyzerAttemptsInput, analyzerAttemptsWarning, analyzeBtn);

    targetWinsPresets.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).dataset.value) {
            const value = (target as HTMLButtonElement).dataset.value;
            if (value === 'custom') {
                targetWinsInput.value = '';
                targetWinsInput.focus();
            } else {
                targetWinsInput.value = value;
                if (value === '8') {
                    recruitmentTypeSelect.value = 'standard';
                    recruitmentTypeSelect.dispatchEvent(new Event('change'));
                }
            }
            updateTargetWinsUI();
        }
    });
    targetWinsInput.addEventListener('input', updateTargetWinsUI);

    const priceSettingInputs = [coinEfficiencyInput, quartzEfficiencyInput, confidentialCostInput, standardCostInput];
    priceSettingInputs.forEach(input => input.addEventListener('input', updateAllCosts));
    confidentialCostCurrencySelect.addEventListener('change', updateAllCosts);

    coinEfficiencyPresets.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).dataset.value) {
            const value = (target as HTMLButtonElement).dataset.value;
            if (value === 'custom') {
                coinEfficiencyInput.value = '';
                coinEfficiencyInput.focus();
            } else {
                coinEfficiencyInput.value = value;
            }
            updateCoinPresetUI();
            updateAllCosts();
        }
    });
    coinEfficiencyInput.addEventListener('input', updateCoinPresetUI);

    confidentialCostPresets.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).dataset.value) {
            const value = (target as HTMLButtonElement).dataset.value;
            if (value === 'custom') {
                confidentialCostInput.value = '';
                confidentialCostInput.focus();
            } else {
                const [cost, currency] = value.split('-');
                confidentialCostInput.value = cost;
                confidentialCostCurrencySelect.value = currency;
            }
            updateConfidentialPresetUI();
            updateAllCosts();
        }
    });
    confidentialCostInput.addEventListener('input', updateConfidentialPresetUI);
    confidentialCostCurrencySelect.addEventListener('change', updateConfidentialPresetUI);
    
    calculateBtn.addEventListener('click', handleCalculate);
    analyzeBtn.addEventListener('click', handleAnalyze);

    // --- Initialize App ---
    loadInitialTheme();
    loadPriceSettings();
    updateTargetWinsUI();
    updateTotalAttemptsDisplay();
});
