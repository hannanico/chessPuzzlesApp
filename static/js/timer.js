let timerInterval;
let seconds = 0; 

export function startTimer(){
    resetTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    seconds++;
    const mins = Math.floor(seconds/60).toString().padStart(2,'0');
    const secs = (seconds%60).toString().padStart(2,'0');
    document.getElementById('timer').textContent = `${mins}:${secs}`;
    
    // Optional: Rotate clock 6 degrees per second (full rotation per minute)
    document.querySelector('.clock-icon').style.transform = `rotate(${seconds * 90}deg)`;
}

function resetTimer(){
    clearInterval(timerInterval);
    seconds = 0;
    document.getElementById('timer').textContent = '00:00';
    document.querySelector('.clock-icon').style.transform = 'rotate(0deg)';
}