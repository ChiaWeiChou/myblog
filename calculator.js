/**
 * 安全槓桿計算器 - 核心計算邏輯
 * 基於 Will 的安全槓桿理論
 */

// 防抖動計時器
let debounceTimer;

// 圖表實例
let growthChart = null;

// DOM 元素
const inputs = {
    monthlyIncome: document.getElementById('monthlyIncome'),
    monthlyExpense: document.getElementById('monthlyExpense'),
    currentAssets: document.getElementById('currentAssets'),
    emergencyFund: document.getElementById('emergencyFund'),
    loanRate: document.getElementById('loanRate'),
    investmentReturn: document.getElementById('investmentReturn'),
    loanTerm: document.getElementById('loanTerm'),
    safetyRatio: document.getElementById('safetyRatio'),
    simulationYears: document.getElementById('simulationYears'),
    marginRatio: document.getElementById('marginRatio')
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 綁定輸入事件
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', debouncedCalculate);
        }
    });
    
    // 初始計算
    calculate();
});

// 防抖動函數
function debouncedCalculate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(calculate, 300);
}

// 主要計算函數
function calculate() {
    const data = getInputData();
    
    if (!validateInputs(data)) {
        return;
    }
    
    // 計算核心指標
    const results = calculateCoreMetrics(data);
    
    // 更新 UI
    updateResults(results);
    updateLoanTable(results, data);
    updateChart(data, results);
    updateScenarios(data, results);
    updateRecommendations(data, results);
    checkRiskWarnings(data, results);
}

// 獲取輸入資料
function getInputData() {
    return {
        monthlyIncome: parseFloat(inputs.monthlyIncome.value) || 0,
        monthlyExpense: parseFloat(inputs.monthlyExpense.value) || 0,
        currentAssets: parseFloat(inputs.currentAssets.value) || 0,
        emergencyFund: parseFloat(inputs.emergencyFund.value) || 0,
        loanRate: parseFloat(inputs.loanRate.value) || 0,
        investmentReturn: parseFloat(inputs.investmentReturn.value) || 0,
        loanTerm: parseFloat(inputs.loanTerm.value) || 7,
        safetyRatio: parseFloat(inputs.safetyRatio.value) || 50,
        simulationYears: parseFloat(inputs.simulationYears.value) || 20,
        marginRatio: parseFloat(inputs.marginRatio.value) || 60
    };
}

// 驗證輸入
function validateInputs(data) {
    let isValid = true;
    
    // 清除之前的錯誤樣式
    Object.values(inputs).forEach(input => {
        if (input) input.classList.remove('error');
    });
    
    // 驗證必填欄位
    const requiredFields = ['monthlyIncome', 'monthlyExpense', 'currentAssets', 'emergencyFund', 'loanRate', 'investmentReturn', 'loanTerm'];
    
    requiredFields.forEach(field => {
        if (!inputs[field] || !inputs[field].value || parseFloat(inputs[field].value) < 0) {
            if (inputs[field]) inputs[field].classList.add('error');
            isValid = false;
        }
    });
    
    return isValid;
}

// 計算核心指標
function calculateCoreMetrics(data) {
    const monthlySurplus = data.monthlyIncome - data.monthlyExpense;
    const annualSurplus = monthlySurplus * 12;
    const savingsRate = data.monthlyIncome > 0 ? (monthlySurplus / data.monthlyIncome) * 100 : 0;
    
    // 安全月付額上限（根據 Will 原則：月付額 ≤ 盈餘的一半）
    const safetyRatioDecimal = data.safetyRatio / 100;
    const maxMonthlyPayment = Math.max(0, monthlySurplus * safetyRatioDecimal);
    
    // 月利率
    const monthlyRate = data.loanRate / 100 / 12;
    const numPayments = data.loanTerm * 12;
    
    // 計算可貸款金額（使用年金現值公式）
    let maxLoanAmount = 0;
    if (monthlyRate > 0 && numPayments > 0) {
        maxLoanAmount = maxMonthlyPayment * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
    } else if (numPayments > 0) {
        maxLoanAmount = maxMonthlyPayment * numPayments;
    }
    
    // 總利息成本
    const totalInterest = (maxMonthlyPayment * numPayments) - maxLoanAmount;
    
    // 現金流覆蓋率
    const cashflowCoverage = monthlySurplus > 0 ? (maxMonthlyPayment / monthlySurplus) * 100 : 0;
    
    // 建議槓桿倍數
    const leverageRatio = data.currentAssets > 0 ? maxLoanAmount / data.currentAssets : 0;
    
    // 利差
    const interestSpread = data.investmentReturn - data.loanRate;
    
    // 風險評級
    let riskLevel, riskDesc, riskClass;
    if (savingsRate >= 40 && cashflowCoverage <= 40 && interestSpread >= 3) {
        riskLevel = '低';
        riskDesc = '財務狀況穩健，適合槓桿';
        riskClass = 'risk-low';
    } else if (savingsRate >= 25 && cashflowCoverage <= 55 && interestSpread >= 2) {
        riskLevel = '中';
        riskDesc = '需謹慎評估，控制槓桿';
        riskClass = 'risk-medium';
    } else {
        riskLevel = '高';
        riskDesc = '建議先改善財務狀況';
        riskClass = 'risk-high';
    }
    
    return {
        monthlySurplus,
        annualSurplus,
        savingsRate,
        maxMonthlyPayment,
        maxLoanAmount,
        totalInterest,
        cashflowCoverage,
        leverageRatio,
        interestSpread,
        riskLevel,
        riskDesc,
        riskClass,
        monthlyRate,
        numPayments
    };
}

// 更新結果顯示
function updateResults(results) {
    document.getElementById('leverageRatio').textContent = results.leverageRatio.toFixed(2);
    
    const riskCard = document.getElementById('riskCard');
    riskCard.className = 'result-card ' + results.riskClass;
    document.getElementById('riskLevel').textContent = results.riskLevel;
    document.getElementById('riskDesc').textContent = results.riskDesc;
    
    document.getElementById('maxMonthlyPayment').textContent = formatCurrency(results.maxMonthlyPayment);
    document.getElementById('cashflowCoverage').textContent = results.cashflowCoverage.toFixed(1);
}

// 更新貸款表格
function updateLoanTable(results, data) {
    const monthlyRate = results.monthlyRate;
    const numPayments = results.numPayments;
    
    // 三種月付額情境
    const payments = [
        results.monthlySurplus * 0.3,
        results.monthlySurplus * 0.5,
        results.monthlySurplus * 0.7
    ];
    
    const labels = ['保守 (30%)', '穩健 (50%)', '積極 (70%)'];
    const rowIds = ['loanRow1', 'loanRow2', 'loanRow3'];
    
    payments.forEach((payment, index) => {
        let loanAmount = 0;
        if (monthlyRate > 0 && numPayments > 0) {
            loanAmount = payment * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
        } else if (numPayments > 0) {
            loanAmount = payment * numPayments;
        }
        
        const totalPayment = payment * numPayments;
        const totalInterest = totalPayment - loanAmount;
        
        document.getElementById(`payment${index + 1}`).textContent = formatCurrency(payment) + '/月';
        document.getElementById(`amount${index + 1}`).textContent = formatCurrency(loanAmount);
        document.getElementById(`interest${index + 1}`).textContent = formatCurrency(totalInterest);
        
        // 高亮建議選項（50%）
        const row = document.getElementById(rowIds[index]);
        if (index === 1) {
            row.classList.add('highlight');
        } else {
            row.classList.remove('highlight');
        }
    });
}

// 更新圖表
function updateChart(data, results) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    // 生成年份標籤
    const years = [];
    for (let i = 0; i <= data.simulationYears; i++) {
        years.push(`第${i}年`);
    }
    
    // 計算三種情境的資產成長
    const scenarioA = calculateScenarioA(data, results); // 無槓桿
    const scenarioB = calculateScenarioB(data, results); // 保守槓桿 (30%)
    const scenarioC = calculateScenarioC(data, results); // 穩健槓桿 (50%)
    
    // 銷毀舊圖表
    if (growthChart) {
        growthChart.destroy();
    }
    
    // 創建新圖表
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: '無槓桿',
                    data: scenarioA,
                    borderColor: '#94a3b8',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '保守槓桿 (30%)',
                    data: scenarioB,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '穩健槓桿 (50%)',
                    data: scenarioC,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(0) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'K';
                            }
                            return value;
                        }
                    }
                }
            }
        }
    });
}

// 情境 A：無槓桿
function calculateScenarioA(data, results) {
    const values = [data.currentAssets];
    const annualReturn = data.investmentReturn / 100;
    
    for (let year = 1; year <= data.simulationYears; year++) {
        const prevValue = values[year - 1];
        const newValue = (prevValue + results.annualSurplus) * (1 + annualReturn);
        values.push(newValue);
    }
    
    return values;
}

// 情境 B：保守槓桿 (30%)
function calculateScenarioB(data, results) {
    const values = [data.currentAssets];
    const annualReturn = data.investmentReturn / 100;
    const monthlyRate = data.loanRate / 100 / 12;
    const numPayments = data.loanTerm * 12;
    const monthlyPayment = results.monthlySurplus * 0.3;
    
    // 計算貸款金額
    let loanAmount = 0;
    if (monthlyRate > 0 && numPayments > 0) {
        loanAmount = monthlyPayment * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
    }
    
    let remainingLoan = loanAmount;
    let currentAssets = data.currentAssets + loanAmount;
    
    for (let year = 1; year <= data.simulationYears; year++) {
        // 每年還款
        for (let month = 0; month < 12; month++) {
            if (remainingLoan > 0) {
                const interestPayment = remainingLoan * monthlyRate;
                const principalPayment = Math.min(monthlyPayment - interestPayment, remainingLoan);
                remainingLoan -= principalPayment;
                currentAssets = currentAssets * (1 + annualReturn / 12) - monthlyPayment;
            } else {
                currentAssets = currentAssets * (1 + annualReturn / 12) + (results.monthlySurplus / 12);
            }
        }
        values.push(Math.max(0, currentAssets));
    }
    
    return values;
}

// 情境 C：穩健槓桿 (50%)
function calculateScenarioC(data, results) {
    const values = [data.currentAssets];
    const annualReturn = data.investmentReturn / 100;
    const monthlyRate = data.loanRate / 100 / 12;
    const numPayments = data.loanTerm * 12;
    const monthlyPayment = results.monthlySurplus * 0.5;
    
    // 計算貸款金額
    let loanAmount = 0;
    if (monthlyRate > 0 && numPayments > 0) {
        loanAmount = monthlyPayment * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
    }
    
    let remainingLoan = loanAmount;
    let currentAssets = data.currentAssets + loanAmount;
    
    for (let year = 1; year <= data.simulationYears; year++) {
        // 每年還款
        for (let month = 0; month < 12; month++) {
            if (remainingLoan > 0) {
                const interestPayment = remainingLoan * monthlyRate;
                const principalPayment = Math.min(monthlyPayment - interestPayment, remainingLoan);
                remainingLoan -= principalPayment;
                currentAssets = currentAssets * (1 + annualReturn / 12) - monthlyPayment;
            } else {
                currentAssets = currentAssets * (1 + annualReturn / 12) + (results.monthlySurplus / 12);
            }
        }
        values.push(Math.max(0, currentAssets));
    }
    
    return values;
}

// 更新情境結果
function updateScenarios(data, results) {
    const annualReturn = data.investmentReturn / 100;
    const years = data.simulationYears;
    
    // 情境 A：無槓桿
    const scenarioA = calculateFinalValue(data.currentAssets, results.annualSurplus, annualReturn, years, 0, 0, 0);
    document.getElementById('scenarioA').textContent = formatCurrency(scenarioA);
    
    // 情境 B：安全槓桿（使用 50%）
    const monthlyPaymentB = results.monthlySurplus * 0.5;
    const scenarioB = calculateFinalValueWithLoan(data, results, monthlyPaymentB, years);
    document.getElementById('scenarioB').textContent = formatCurrency(scenarioB);
    
    // 情境 C：永續槓桿（模擬質押效果）
    const scenarioC = calculatePerpetualLeverage(data, results, years);
    document.getElementById('scenarioC').textContent = formatCurrency(scenarioC);
}

// 計算最終價值（無槓桿）
function calculateFinalValue(initialAssets, annualInvestment, annualReturn, years, loanAmount, monthlyPayment, loanTerm) {
    let value = initialAssets;
    
    for (let year = 1; year <= years; year++) {
        value = (value + annualInvestment) * (1 + annualReturn);
    }
    
    return value;
}

// 計算含貸款的最終價值
function calculateFinalValueWithLoan(data, results, monthlyPayment, years) {
    const annualReturn = data.investmentReturn / 100;
    const monthlyRate = data.loanRate / 100 / 12;
    const numPayments = data.loanTerm * 12;
    
    let loanAmount = 0;
    if (monthlyRate > 0 && numPayments > 0) {
        loanAmount = monthlyPayment * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
    }
    
    let remainingLoan = loanAmount;
    let currentAssets = data.currentAssets + loanAmount;
    
    for (let year = 1; year <= years; year++) {
        for (let month = 0; month < 12; month++) {
            if (remainingLoan > 0) {
                const interestPayment = remainingLoan * monthlyRate;
                const principalPayment = Math.min(monthlyPayment - interestPayment, remainingLoan);
                remainingLoan -= principalPayment;
                currentAssets = currentAssets * (1 + annualReturn / 12) - monthlyPayment;
            } else {
                currentAssets = currentAssets * (1 + annualReturn / 12) + (results.monthlySurplus / 12);
            }
        }
    }
    
    return Math.max(0, currentAssets);
}

// 計算永續槓桿（質押效果）
function calculatePerpetualLeverage(data, results, years) {
    const annualReturn = data.investmentReturn / 100;
    const marginRatio = data.marginRatio / 100;
    
    let currentAssets = data.currentAssets;
    let borrowedAmount = 0;
    
    for (let year = 1; year <= years; year++) {
        // 正常投資成長
        currentAssets = (currentAssets + results.annualSurplus) * (1 + annualReturn);
        
        // 當資產達到一定規模後，開啟質押循環
        if (currentAssets >= 5000000) {
            // 每年可新增質押借款（模擬資產增值後的新增借款額度）
            const newBorrowable = (currentAssets * marginRatio) - borrowedAmount;
            if (newBorrowable > 0) {
                borrowedAmount += newBorrowable * 0.1; // 保守使用 10% 新增額度
                currentAssets += newBorrowable * 0.1;
            }
        }
    }
    
    return currentAssets;
}

// 更新建議
function updateRecommendations(data, results) {
    const list = document.getElementById('recommendationList');
    const recommendations = [];
    
    // 儲蓄率建議
    if (results.savingsRate < 30) {
        recommendations.push('您的儲蓄率偏低，建議先提高儲蓄率至 30% 以上再考慮槓桿');
    } else if (results.savingsRate >= 40) {
        recommendations.push('您的儲蓄率優秀（' + results.savingsRate.toFixed(1) + '%），具備良好的槓桿基礎');
    }
    
    // 緊急備用金建議
    const requiredEmergencyFund = (data.monthlyExpense + results.maxMonthlyPayment) * 12;
    if (data.emergencyFund < requiredEmergencyFund) {
        recommendations.push(`建議將緊急備用金增加至 ${formatCurrency(requiredEmergencyFund)}（12 個月開銷含貸款）`);
    } else {
        recommendations.push('緊急備用金充足，符合安全槓桿要求');
    }
    
    // 利差建議
    if (results.interestSpread < 3) {
        recommendations.push(`利差較小（${results.interestSpread.toFixed(1)}%），建議尋找更低利率或調整預期報酬`);
    } else {
        recommendations.push(`利差良好（${results.interestSpread.toFixed(1)}%），具備套利空間`);
    }
    
    // 貸款建議
    if (results.maxLoanAmount > 0) {
        recommendations.push(`建議申請信貸 ${formatCurrency(results.maxLoanAmount)}，月付額控制在 ${formatCurrency(results.maxMonthlyPayment)} 以內`);
    }
    
    // 投資標的建議
    recommendations.push('建議投資標的：0050、VT、SPY 等被動型 ETF');
    
    // 更新列表
    list.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
}

// 檢查風險警告
function checkRiskWarnings(data, results) {
    const warnings = [];
    const banner = document.getElementById('warningBanner');
    const bannerText = document.getElementById('warningText');
    const riskSection = document.getElementById('riskWarnings');
    const riskList = document.getElementById('riskWarningList');
    
    // 檢查各種風險條件
    if (results.savingsRate < 25) {
        warnings.push('儲蓄率低於 25%，不適合使用槓桿');
    }
    
    if (results.cashflowCoverage > 60) {
        warnings.push('月付額佔盈餘比例過高，可能影響生活品質');
    }
    
    if (results.interestSpread < 2) {
        warnings.push('利差過小，槓桿效益有限');
    }
    
    const requiredEmergencyFund = (data.monthlyExpense + results.maxMonthlyPayment) * 12;
    if (data.emergencyFund < requiredEmergencyFund * 0.5) {
        warnings.push('緊急備用金嚴重不足，請先建立至少 6 個月的開銷儲備');
    }
    
    if (data.loanRate > 5) {
        warnings.push('貸款利率過高，建議尋找更低利率的管道');
    }
    
    // 更新警告顯示
    if (warnings.length > 0) {
        banner.style.display = 'flex';
        banner.className = 'warning-banner danger';
        bannerText.textContent = `發現 ${warnings.length} 個風險項目，請審慎評估`;
        
        riskSection.style.display = 'block';
        riskList.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
    } else {
        banner.style.display = 'flex';
        banner.className = 'warning-banner';
        bannerText.textContent = '您的財務狀況符合安全槓桿的基本條件';
        
        riskSection.style.display = 'none';
    }
}

// 格式化貨幣
function formatCurrency(value) {
    if (isNaN(value) || value === null) return '-';
    
    if (value >= 100000000) {
        return (value / 100000000).toFixed(2) + ' 億';
    } else if (value >= 10000) {
        return (value / 10000).toFixed(1) + ' 萬';
    } else {
        return Math.round(value).toLocaleString();
    }
}

// 格式化數字
function formatNumber(value) {
    if (isNaN(value) || value === null) return '-';
    return value.toLocaleString();
}
