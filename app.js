/**
 * flappy bird
 * by nick
 * 场景尺寸为素材图片的1/2
 */

(function (window) {

    var game,//游戏控制器
        fps = 80,//游戏的帧数

        boxWidth = 360,//游戏场景宽度
        boxHeight = 640,//游戏场景高度
        groundWidth = 420,//地面背景宽度
        groundHeight = 140,//地面背景高度

        pipeHeight = [],//保存管道高度集合
        pipeWidth = 65,//管道宽度
        pipeMinHeight = 50,//管道最低高度
        pipeMaxHeight = 250,//管道最高高度
        pipeMaxNum = 3,//每次生成的管道数
        pipeSpace = 200,//上下管道空隙
        pipeInterval = pipeWidth + 140,//管道间隔
        pipe = [],//管道位置序列

        birdWidth = 43,
        birdHeight = 30,
        birdX = 95,
        birdY = 210,
        birdPosition = [birdX, birdY],//初始化鸟坐标位置
        birdJumpSpeed = 9,//鸟每次跳跃的速度
        gravity = 0.4,//重力加速度
        birdYSpeed = 0,//初始化鸟Y轴的运动速度

        highScore = localStorage.n_fbHighScore || 0,//最高分
        score = 0,//当前分数

        restartBtnWidth = 131,//重新开始按钮
        restartBtnHeight = 74;

    //游戏场景
    var c = document.getElementById('gameContent'),
        ctx = c.getContext('2d');

    c.width = boxWidth;
    c.height = boxHeight;
    ctx.font = 'bold 40px Arial,sans-serif';
    ctx.fillStyle = '#fff';

    //游戏场景图片
    var bg = new Image(),
        ground = new Image(),
        imgSprite = new Image();
    bg.src        = 'img/bg.png';
    ground.src    = 'img/ground.png';
    imgSprite.src = 'img/flappy_packer.png';

    //游戏音效
    var flySound = {//飞行音效
            dom: document.getElementById('J_flySound'),
            src: 'sounds/wing.mp3'
        },
        scoreSound = {//得分音效
            dom: document.getElementById('J_scoreSound'),
            src: 'sounds/point.mp3'
        },
        crashSound = {//碰撞音效
            dom: document.getElementById('J_crashSound'),
            src: 'sounds/hit.mp3'
        },
        endSound = {//结束音效
            dom: document.getElementById('J_endSound'),
            src: 'sounds/die.mp3'
        },
        startSound = {//开始音效
            dom: document.getElementById('J_startSound'),
            src: 'sounds/swooshing.mp3'
        };

    function playSound(sound, src) {//播放音频
        sound.src = src;
    }

    (function () {//初始化

        var initBirdInterval;

        bg.onload = function () {//绘制背景
            ctx.drawImage(bg, 0, 0, boxWidth, boxHeight);
        };
        ground.onload = function () {//绘制动态地面
            game.drawGround();
        };
        imgSprite.onload = function () {//绘制开始场景
            ctx.drawImage(imgSprite, 525, 320, 460, 126, boxWidth / 2 - 115, 80, 230, 63);
            ctx.drawImage(imgSprite, 760, 0, 286, 248, boxWidth / 2 - 71, 180, 143, 124);

            initBirdInterval = setInterval(function () {
                game.drawBird();
            }, 1000 / fps);

        };

        for (var i = 0; i < 100; i += 1) {//循环初始化管道高度数据
            pipeHeight[i] = Math.ceil(Math.random() * (pipeMaxHeight - pipeMinHeight)) + pipeMinHeight;
        }

        function handle (e) {//操作事件
            if (e.which === 32 || e.which === 1) {//空格，左键
                var status = game.status;

                birdYSpeed = -birdJumpSpeed;//更新鸟Y轴速度
                if (status === 0) {//未开始
                    clearInterval(initBirdInterval);
                    clearInterval(game.groundInterval);
                    game.start();
                } else if (status === 1) {//进行中

                    playSound(flySound.dom, flySound.src);

                } else if (status === 2) {//已结束
                    if(e.layerX > 40 &&
                        e.layerX < 40 + restartBtnWidth &&
                        e.layerY > 300 &&
                        e.layerY < 300 + restartBtnHeight) {
                        game.restart();
                    }
                }
            }
        }

        window.addEventListener('keydown', handle, false);
        c.addEventListener('mousedown', handle, false);

    }());

    window.game = game = {

        status: 0,//游戏状态，0 为未开始， 1 为进行中， 2 为已结束

        start: function () {

            this.status = 1;
            for (var i = 0; i < pipeMaxNum; i += 1) {
                this.createPipe(i);//初始化管道数据
            }

            this.drawGround();

            playSound(startSound.dom, startSound.src);

            this.gameInterval = setInterval(this.run, 1000 / fps);
        },
        restart: function () {//重新开始游戏

            ctx.font = 'bold 40px Arial,sans-serif';
            //初始化数据
            birdPosition = [birdX, birdY];
            score = 0;

            this.start();
        },
        run: function () {

            if (game.status === 2) {
                game.end();
                return false;
            }

            birdYSpeed = birdYSpeed + gravity;
            game.drawScene();
            game.drawBirdSport();
            game.birdCrash();
            game.drawScore();

        },
        end: function () {
            playSound(endSound.dom, endSound.src);

            clearInterval(this.gameInterval);
            clearInterval(this.groundInterval);

            if (highScore < score) {
                highScore = score;
                localStorage.n_fbHighScore = highScore;
            }

            ctx.drawImage(imgSprite, 16, 319, 480, 107, boxWidth / 2 - 120, 80, 240, 54);
            ctx.drawImage(imgSprite, 15, 6, 567, 286, boxWidth / 2 - 142, 140, 284, 143);
            ctx.drawImage(imgSprite, 463, 463, restartBtnWidth * 2, restartBtnHeight * 2, 40, 300, restartBtnWidth, restartBtnHeight);
            ctx.font = 'bold 24px Arial,sans-serif';
            ctx.fillText(score, 255, 200);
            ctx.fillText(highScore, 255, 253);
        },

        drawScene: function () {//绘制场景，不包括动态地面
            ctx.clearRect(0, 0, boxWidth, boxHeight - groundHeight);//清理场景上一帧的画面
            this.drawBg();
            this.drawPipe();
        },
        drawBg: function () {//绘制背景
            ctx.drawImage(bg, 0, 0, 720, 999, 0, 0, boxWidth, boxHeight - groundHeight);
        },
        drawGround: function () {//绘制地面
            var i = 0;
            this.groundInterval = setInterval(function () {
                ctx.clearRect(0, boxHeight - groundHeight, boxWidth, groundHeight);
                ctx.drawImage(ground, i, boxHeight - groundHeight, groundWidth, groundHeight);

                i <= boxWidth - groundWidth ? i = 0 : i -= 1;

            }, 1000 / fps);
        },

        drawPipe: function () {//绘制管道
            var i, bottomPipeHeight, topPipeHeight, locationX, locationY;
            this.updatePipe();
            for (i = 0; i < pipeMaxNum; i += 1) {

                bottomPipeHeight = pipe[i][1];//下管道高度
                topPipeHeight = boxHeight - groundHeight - bottomPipeHeight - pipeSpace;//上管道高度
                locationX  = pipe[i][0];
                locationY  = boxHeight - (groundHeight + bottomPipeHeight);

                //绘制下方管道
                ctx.drawImage(imgSprite, 10, 478, pipeWidth * 2, bottomPipeHeight * 2, locationX, locationY, pipeWidth, bottomPipeHeight);
                //绘制上方管道
                ctx.drawImage(imgSprite, 161, 489 + (800 - topPipeHeight * 2), pipeWidth * 2, topPipeHeight * 2, locationX, 0, pipeWidth, topPipeHeight);
            }
        },
        createPipe: function (i) {//创建管道
            pipe[i] = [boxWidth + i * pipeInterval, pipeHeight[Math.ceil(Math.random() * (pipeHeight.length - 1))]];
        },
        updatePipe: function () {//更新管道
            var i;
            for (i = 0; i < pipeMaxNum; i += 1) {
                pipe[i][0] = pipe[i][0] - 1;
            }

            if (pipe[0][0] <= -pipeWidth) {//当前第一根管道离开场景时更新管道数据
                pipe.splice(0, 1);
                pipe.push([pipe[pipe.length - 1][0] + pipeInterval, pipeHeight[Math.ceil(Math.random() * (pipeHeight.length - 1))]]);
            }

        },

        birdWingStatus: 0,//初始化鸟的翅膀状态
        drawBird: function () {//绘制鸟
            var i = this.birdWingStatus, speed = 10;//翅膀挥舞速度，值越大，速度越慢

            birdPosition[1] = birdPosition[1] + birdYSpeed;
            if (i < speed) {
                ctx.drawImage(imgSprite, 673, 1, birdWidth * 2, birdHeight * 2, birdPosition[0], birdPosition[1], birdWidth, birdHeight);
            } else if (i < speed * 2) {
                ctx.drawImage(imgSprite, 673, 62, birdWidth * 2, birdHeight * 2, birdPosition[0], birdPosition[1], birdWidth, birdHeight);
            } else if (i < speed * 3) {
                ctx.drawImage(imgSprite, 673, 123, birdWidth * 2, birdHeight * 2, birdPosition[0], birdPosition[1], birdWidth, birdHeight);
            }

            i < speed * 3 - 1 ? this.birdWingStatus += 1 : this.birdWingStatus = 0;

        },
        drawBirdSport: function () {//鸟的运动姿势?!

            ctx.save();
            ctx.translate(birdPosition[0] + birdWidth / 2, birdPosition[1] + birdHeight / 2);
            if (birdYSpeed <= 0) {
                ctx.rotate(-30 * Math.PI / 180);
            } else if (birdYSpeed > 0 && birdYSpeed <= 10) {
                ctx.rotate(30 * Math.PI / 180);
            } else if (birdYSpeed > 10 && birdYSpeed <= 20) {
                ctx.rotate(60 * Math.PI / 180);
            } else if (birdYSpeed > 20) {
                ctx.rotate(90 * Math.PI / 180);
            }
            ctx.translate(-birdPosition[0] - birdWidth / 2, -birdPosition[1] - birdHeight / 2);
            this.drawBird();
            ctx.restore();
        },
        birdCrash: function () {//碰撞模块
            var i, len = pipe.length,
                birdRightX = birdPosition[0] + birdWidth,
                birdBottomY = birdPosition[1] + birdHeight,
                groundTop = boxHeight - groundHeight,

                pipeRight;

            //循环判断是否碰撞管道
            for (i = 0; i < len; i += 1) {

                pipeRight = pipe[i][0] + pipeWidth;

                if (birdRightX === pipeRight + 1) {
                    playSound(scoreSound.dom, scoreSound.src);
                    this.updateScore(i);//通过一根管道加一分
                }

                //如果未到
                if (birdRightX < pipe[i][0]) {
                    continue;
                }
                //如果碰撞
                if ((birdRightX > pipe[i][0] &&
                    birdPosition[0] < pipeRight) &&
                    (birdPosition[1] < groundTop - pipe[i][1] - pipeSpace ||
                        birdBottomY > groundTop - pipe[i][1])) {
                    playSound(crashSound.dom, crashSound.src);
                    this.status = 2;//游戏结束
                    break;
                }
            }

            if (birdBottomY > groundTop) {//判断是否碰撞地面
                playSound(crashSound.dom, crashSound.src);
                this.status = 2;//游戏结束
            }
        },
        updateScore: function () {//更新分数
            score += 1;
        },
        drawScore: function () {//绘制分数
            ctx.fillText(score, boxWidth / 2 - 20, 120);
        }
    };

}(window));