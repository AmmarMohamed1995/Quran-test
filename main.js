document.addEventListener("DOMContentLoaded", () => {
    let data = document.getElementById("data");
    let loader = document.getElementById("loader");
    let musicPlayer = document.getElementById("music-player");
    let playPauseButton = document.getElementById("play-pause-button");
    let closeMusicPlayerButton = document.getElementById("close-music-player");
    let currentTrack = document.getElementById("current-track");
    let progressBar = document.getElementById("progress-bar");
    let progress = document.getElementById("progress");
    let audio = null;
    let isPlaying = false;
    let currentButton = null;

    // عرض الـ loader عند بدء التحميل
    loader.style.display = 'block';

    // إنشاء الجدول والرأس
    data.innerHTML = `
        <table class="table">
          <thead>
            <tr id='tr'>
              <th style='color: rgba(0, 0, 0, 0.92);' scope="col">Number</th>
              <th style='color: rgba(0, 0, 0, 0.92);' scope="col">Name</th>
              <th style='color: rgba(0, 0, 0, 0.92);' scope="col">EnglishName</th>
              <th style='color: rgba(0, 0, 0, 0.92);' scope="col">Action</th>
            </tr>
          </thead>
          <tbody id="tableBody">
          </tbody>
        </table>
    `;

    let tableBody = document.getElementById("tableBody");

    fetch("http://api.alquran.cloud/v1/quran/ar.alafasy")
        .then(res => res.json())
        .then(json => {
            let uniqueSurahs = [];
            let seenSurahNames = new Set();

            json.data.surahs.forEach(surah => {
                if (!seenSurahNames.has(surah.name)) {
                    uniqueSurahs.push(surah);
                    seenSurahNames.add(surah.name);
                }
            });

            uniqueSurahs.forEach(surah => {
                let row = document.createElement('tr');
                row.innerHTML = `
                  <th scope="row">${surah.number}</th>
                  <td>${surah.name}</td>
                  <td>${surah.englishName}</td>
                  <td>
                    <button class="play-button" data-audio="${surah.ayahs[0].audioSecondary[0]}">
                      <i class="fa-solid fa-play"></i>
                    </button>
                  </td>
                `;
                tableBody.appendChild(row);
            });

            loader.style.display = 'none';

            function loadTrack(url, trackName, startPlaying = true) {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
                audio = new Audio(url);
                if (startPlaying) {
                    audio.play();
                    isPlaying = true;
                    playPauseButton.classList.remove('fa-play');
                    playPauseButton.classList.add('fa-pause');
                    currentTrack.textContent = `Playing: ${trackName}`;
                    musicPlayer.style.display = 'flex';
                }

                // تحديث شريط التقدم
                audio.addEventListener('timeupdate', () => {
                    if (audio.duration) {
                        let progressPercentage = (audio.currentTime / audio.duration) * 100;
                        progress.style.width = progressPercentage + '%';
                    }
                });

                // تخزين معلومات المسار في localStorage
                localStorage.setItem('currentTrack', JSON.stringify({
                    url: url,
                    trackName: trackName,
                    isPlaying: startPlaying
                }));
            }

            function updatePlayButtonState(button, isPlaying) {
                const icon = button.querySelector('i');
                if (isPlaying) {
                    icon.classList.remove('fa-play');
                    icon.classList.add('fa-pause');
                } else {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
            }

            document.querySelectorAll('.play-button').forEach(button => {
                button.addEventListener('click', function() {
                    let audioSrc = this.getAttribute('data-audio');
                    let trackName = this.closest('tr').querySelector('td').textContent || "Unknown Track";

                    if (audio && audio.src !== audioSrc) {
                        audio.pause();
                        updatePlayButtonState(currentButton, false);
                    }

                    if (this.querySelector('i').classList.contains('fa-play')) {
                        loadTrack(audioSrc, trackName);
                        currentButton = this;
                        updatePlayButtonState(this, true);
                    } else {
                        audio.pause();
                        updatePlayButtonState(this, false);
                        audio = null;
                        currentButton = null;
                        // تحديث حالة التشغيل في localStorage
                        localStorage.setItem('currentTrack', JSON.stringify({
                            url: audioSrc,
                            trackName: trackName,
                            isPlaying: false
                        }));
                    }
                });
            });

            // استعادة المسار المحفوظ عند تحميل الصفحة
            let savedTrack = localStorage.getItem('currentTrack');
            if (savedTrack) {
                savedTrack = JSON.parse(savedTrack);
                loadTrack(savedTrack.url, savedTrack.trackName, savedTrack.isPlaying);

                // تحديث حالة زر التشغيل
                document.querySelectorAll('.play-button').forEach(button => {
                    if (button.getAttribute('data-audio') === savedTrack.url) {
                        updatePlayButtonState(button, savedTrack.isPlaying);
                        currentButton = button;
                    }
                });
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            loader.style.display = 'none';
        });

    if (playPauseButton) {
        playPauseButton.addEventListener('click', () => {
            if (audio) {
                if (isPlaying) {
                    audio.pause();
                    playPauseButton.classList.remove('fa-pause');
                    playPauseButton.classList.add('fa-play');
                    isPlaying = false;

                    // تحديث حالة التشغيل في localStorage
                    let savedTrack = localStorage.getItem('currentTrack');
                    if (savedTrack) {
                        savedTrack = JSON.parse(savedTrack);
                        savedTrack.isPlaying = false;
                        localStorage.setItem('currentTrack', JSON.stringify(savedTrack));
                    }
                } else {
                    audio.play();
                    playPauseButton.classList.remove('fa-play');
                    playPauseButton.classList.add('fa-pause');
                    isPlaying = true;

                    // تحديث حالة التشغيل في localStorage
                    let savedTrack = localStorage.getItem('currentTrack');
                    if (savedTrack) {
                        savedTrack = JSON.parse(savedTrack);
                        savedTrack.isPlaying = true;
                        localStorage.setItem('currentTrack', JSON.stringify(savedTrack));
                    }
                }
            }
        });
    }

    if (closeMusicPlayerButton) {
        closeMusicPlayerButton.addEventListener('click', () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            musicPlayer.style.display = 'none';
            playPauseButton.classList.remove('fa-pause');
            playPauseButton.classList.add('fa-play');
            isPlaying = false;
            progress.style.width = '0%'; // إعادة تعيين شريط التقدم

            // تحديث حالة التشغيل في localStorage
            let savedTrack = localStorage.getItem('currentTrack');
            if (savedTrack) {
                savedTrack = JSON.parse(savedTrack);
                savedTrack.isPlaying = false;
                localStorage.setItem('currentTrack', JSON.stringify(savedTrack));
            }
        });
    }
});


// scroll 

let button = document.getElementById('button');
window.onscroll = function (param) {
  if (window.scrollY >= 50) {
    button.classList.add("add");
    
    
  } else {
    button.classList.remove("add")
    
  }
  if (window.scrollY >= 50) {
    
    button.style.opacity = 2;
  } else {
    button.style.opacity = 0;
  }
}

button.onclick = function () {
  window.scrollTo({
    left: 0,
    top: 0,
    behavior: "smooth",
  });
};


// Auto Quran
document.addEventListener('DOMContentLoaded', function() {
        const audio = new Audio("/112.mp3"); // تأكد أن المسار صحيح
        audio.volume = 0.5;

        // محاولة تشغيل الصوت بعد تأكيد التفاعل مع المستخدم
        audio.play().catch(function(error) {
            console.log("Autoplay was prevented. Try interacting with the page first.");
        });

        setTimeout(() => {
            audio.pause();
        }, 10000); // توقف الموسيقى بعد 10 ثواني
    });