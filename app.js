
document.documentElement.classList.add('js');

        // --- 壁纸画廊：选择 / 随机 / 记忆上次选择 ---
        (function() {
            const panel = document.getElementById('wallpaperPanel');
            const grid = document.getElementById('wallpaperGrid');
            const openBtn = document.getElementById('wallpaperSwitch');
            const randomBtn = document.getElementById('wallpaperRandom');
            const closeBtn = document.getElementById('wallpaperPanelClose');
            let current = 0;

            function applyWallpaper(idx) {
                current = idx;
                document.body.style.backgroundImage = `url('background_${idx}.jpg')`;
                try { localStorage.setItem('elmh-wallpaper', idx); } catch (e) {}
            }

            // 生成 9 张壁纸缩略图
            for (let i = 1; i <= 9; i++) {
                const t = document.createElement('div');
                t.className = 'wallpaper-thumb';
                t.style.backgroundImage = `url('background_${i}.jpg')`;
                t.dataset.idx = i;
                t.title = `壁纸 ${i}`;
                t.addEventListener('click', () => {
                    applyWallpaper(i);
                    closePanel();
                });
                grid.appendChild(t);
            }

            function refreshActive() {
                grid.querySelectorAll('.wallpaper-thumb').forEach(t => {
                    t.classList.toggle('active', Number(t.dataset.idx) === current);
                });
            }
            function openPanel() { refreshActive(); panel.classList.add('open'); }
            function closePanel() { panel.classList.remove('open'); }

            openBtn.addEventListener('click', openPanel);
            closeBtn.addEventListener('click', closePanel);
            randomBtn.addEventListener('click', () => {
                let idx;
                do { idx = Math.floor(Math.random() * 9) + 1; } while (idx === current);
                applyWallpaper(idx);
                refreshActive();
                closePanel();
            });
            panel.addEventListener('click', (e) => { if (e.target === panel) closePanel(); });

            // 首次加载：优先使用上次保存的壁纸，否则随机
            let saved = null;
            try { saved = localStorage.getItem('elmh-wallpaper'); } catch (e) {}
            applyWallpaper(saved ? Number(saved) : Math.floor(Math.random() * 9) + 1);
        })();

        // --- 返回顶部 ---
        const backToTop = document.getElementById('backToTop');
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('show', window.scrollY > 400);
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // --- 页脚年份自动更新 ---
        document.getElementById('year').textContent = new Date().getFullYear();

        // --- 打字机效果（格言） ---
        (function() {
            const motto = document.querySelector('.motto');
            if (!motto) return;
            const fullText = motto.textContent.trim();
            motto.textContent = '';
            let i = 0;
            const speed = 100;
            function type() {
                if (i <= fullText.length) {
                    motto.textContent = fullText.slice(0, i);
                    i++;
                    setTimeout(type, i > fullText.length ? 1 : speed);
                }
            }
            setTimeout(type, 800);
        })();

        // --- 滚动入场动画 ---
        document.querySelectorAll('.section').forEach(s => s.classList.add('reveal'));
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        document.querySelectorAll('.section').forEach(s => revealObserver.observe(s));

        // --- 阅读进度条 ---
        const readingProgress = document.getElementById('readingProgress');
        window.addEventListener('scroll', () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            readingProgress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
        }, { passive: true });

        // --- 鼠标跟随光斑 ---
        const glow = document.getElementById('cursorGlow');
        document.addEventListener('mousemove', (e) => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });

        // --- GitHub 仓库展示卡片 ---
        (function() {
            const grid = document.getElementById('repoGrid');
            if (!grid) return;

            function esc(s) {
                return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            }
            const langColors = {
                'Python': '#3572A5', 'C++': '#f34b7d', 'C#': '#178600',
                'JavaScript': '#f1e05a', 'TypeScript': '#3178c6',
                'HTML': '#e34c26', 'CSS': '#563d7c', 'C': '#555555'
            };

            fetch('https://api.github.com/users/Elmhdmnh/repos?sort=updated&per_page=10')
                .then(res => res.json())
                .then(repos => {
                    if (!Array.isArray(repos)) throw new Error('bad response');
                    const list = repos.filter(r => !r.fork).slice(0, 6);
                    if (!list.length) return; // 无仓库时保留页面静态列表
                    grid.innerHTML = ''; // 清空静态回退，替换为实时数据
                    list.forEach(r => {
                        const card = document.createElement('a');
                        card.className = 'repo-card';
                        card.href = r.html_url;
                        card.target = '_blank';
                        card.rel = 'noopener noreferrer';
                        const color = langColors[r.language] || '#8b949e';
                        card.innerHTML = `
                            <div class="repo-name"><i class="fab fa-github"></i> ${esc(r.name)}</div>
                            <div class="repo-desc">${esc(r.description || '暂无描述')}</div>
                            <div class="repo-meta">
                                <span><span class="lang-dot" style="background:${color}"></span>${esc(r.language || 'N/A')}</span>
                                <span><i class="fas fa-star"></i>${r.stargazers_count}</span>
                                <span><i class="fas fa-code-branch"></i>${r.forks_count}</span>
                                <span><i class="fas fa-clock"></i>${new Date(r.updated_at).toLocaleDateString('zh-CN')}</span>
                            </div>`;
                        grid.appendChild(card);
                    });
                })
                .catch(() => {
                    // GitHub API 不可用时保留页面中的静态仓库列表
                });
        })();

        // --- 其他交互逻辑 ---
        function openImageModal(src) {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImg');
            modal.style.display = 'flex';
            modalImg.src = src;
        }
        
        // 模态框点击关闭逻辑（从内联样式迁移到此处）
        const imageModal = document.getElementById('imageModal');
        imageModal.addEventListener('click', function() {
            this.style.display = 'none';
        });
        document.getElementById('modalClose').addEventListener('click', function(e) {
            e.stopPropagation();
            imageModal.style.display = 'none';
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') imageModal.style.display = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            document.querySelector('.bg-overlay').style.transform = `translate(${moveX}px, ${moveY}px)`;
        });

        // --- GitHub 下载加速（多代理 + 安全回退） ---
        (function() {
            const btn = document.getElementById('downloadHorrorGame');
            if (!btn) return;

            const GITHUB_URL = btn.getAttribute('href');
            const originalHtml = btn.innerHTML;

            // 已知的广告/劫持域名黑名单
            const blockedDomains = ['junclikrmedi.com', 'click-v4', 'ad.', 'tracking.'];

            function isSafeUrl(url) {
                if (!url || !url.startsWith('http')) return false;
                return !blockedDomains.some(d => url.includes(d));
            }

            // 直接构造的代理镜像列表（无需 API，更可靠）
            function buildProxyUrls() {
                return [
                    'https://gh.llkk.cc/' + GITHUB_URL,
                    'https://gh-proxy.com/' + GITHUB_URL,
                    'https://mirror.ghproxy.com/' + GITHUB_URL,
                ];
            }

            btn.addEventListener('click', function(e) {
                e.preventDefault();

                // 显示加载状态
                btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> 获取加速链接...';
                btn.style.pointerEvents = 'none';

                // 方案 A：调用 cenguigui API（带安全校验）
                const apiUrl = 'https://api-v2.cenguigui.cn/api/github/?type=json&url=' + encodeURIComponent(GITHUB_URL);

                fetch(apiUrl)
                    .then(res => res.json())
                    .then(data => {
                        if (data.code === 200 && data.data && data.data.downUrl && isSafeUrl(data.data.downUrl)) {
                            window.location.href = data.data.downUrl;
                            return 'ok';
                        }
                        throw new Error('API returned unsafe or invalid URL');
                    })
                    .catch(() => {
                        // 方案 B：直接使用代理镜像
                        const proxies = buildProxyUrls();
                        window.location.href = proxies[0];
                    })
                    .finally(() => {
                        setTimeout(() => {
                            btn.innerHTML = originalHtml;
                            btn.style.pointerEvents = '';
                        }, 2000);
                    });
            });
        })();

    
