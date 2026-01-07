let display = document.getElementById('result');
let currentInput = '';
let operator = '';
let previousInput = '';

function appendToDisplay(value) {
    if (value === '+' || value === '-' || value === '*' || value === '/') {
        if (currentInput === '' && value === '-') {
            currentInput = '-';
        } else if (currentInput !== '') {
            if (previousInput !== '' && operator !== '') {
                calculate();
            }
            operator = value;
            previousInput = currentInput;
            currentInput = '';
        }
    } else {
        currentInput += value;
    }
    updateDisplay();
}

function updateDisplay() {
    if (currentInput === '') {
        display.value = previousInput + ' ' + getOperatorSymbol(operator);
    } else {
        display.value = currentInput;
    }
}

function getOperatorSymbol(op) {
    switch(op) {
        case '*': return '×';
        case '/': return '÷';
        default: return op;
    }
}

function calculate() {
    if (previousInput !== '' && currentInput !== '' && operator !== '') {
        let result;
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        
        switch(operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    display.value = 'Error';
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }
        
        currentInput = result.toString();
        operator = '';
        previousInput = '';
        display.value = currentInput;
    }
}

function clearDisplay() {
    currentInput = '';
    operator = '';
    previousInput = '';
    display.value = '';
}

function deleteLast() {
    if (currentInput !== '') {
        currentInput = currentInput.slice(0, -1);
        updateDisplay();
    }
}

// Keyboard support
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if (key >= '0' && key <= '9' || key === '.') {
        appendToDisplay(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        appendToDisplay(key);
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
    } else if (key === 'Backspace') {
        deleteLast();
    }
});