let port;
let reader;
let bin1Level = 0;

const connectBtn = document.getElementById('connectBtn');
const statusSpan = document.getElementById('status');
const level1Span = document.getElementById('level1');
const indicator1Span = document.getElementById('indicator1');
const bin1Div = document.getElementById('bin1');
const rawDataDiv = document.getElementById('rawData');
const lastUpdateSpan = document.getElementById('lastUpdate');

// Проверка поддержки Web Serial API
if (!navigator.serial) {
    statusSpan.textContent = '❌ Web Serial API не поддерживается. Используй Chrome/Edge.';
    connectBtn.disabled = true;
}

// Подключение к Arduino
connectBtn.addEventListener('click', async () => {
    try {
        port = await navigator.serial.requestPort();
        const baudRate = parseInt(document.getElementById('baudRate').value);
        
        await port.open({ baudRate: baudRate });
        
        statusSpan.textContent = '✅ Подключено';
        connectBtn.textContent = '🔄 Подключено';
        connectBtn.disabled = true;
        
        reader = port.readable.getReader();
        readLoop();
    } catch (error) {
        console.error('Ошибка:', error);
        statusSpan.textContent = '❌ Ошибка подключения';
    }
});

// Чтение данных из Serial порта
async function readLoop() {
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value);
            
            const lines = buffer.split('\n');
            buffer = lines.pop();
            
            for (const line of lines) {
                processData(line.trim());
            }
        }
    } catch (error) {
        console.error('Ошибка чтения:', error);
        statusSpan.textContent = '❌ Ошибка чтения';
    } finally {
        reader.releaseLock();
        await port.close();
    }
}

// Обработка полученных данных
function processData(data) {
    if (!data) return;
    
    rawDataDiv.textContent = data;
    
    if (data.startsWith('FULLNESS:')) {
        const level = parseInt(data.split(':')[1]);
        if (!isNaN(level)) {
            bin1Level = level;
            updateUI(level);
        }
    }
    
    const now = new Date();
    lastUpdateSpan.textContent = now.toLocaleTimeString();
}

// Обновление интерфейса (цвета и проценты)
function updateUI(level) {
    level1Span.textContent = `Уровень: ${level}%`;
    
    // ПОРОГИ: зелёный 0-39%, жёлтый 40-69%, красный 70-100%
    if (level < 40) {
        indicator1Span.textContent = '🟢';
        bin1Div.className = 'bin green';
    } else if (level < 70) {
        indicator1Span.textContent = '🟡';
        bin1Div.className = 'bin yellow';
    } else {
        indicator1Span.textContent = '🔴';
        bin1Div.className = 'bin red';
    }
}
