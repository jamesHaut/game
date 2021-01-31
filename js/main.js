import Player from './player/index'
import Enemy from './npc/enemy'
import BackGround from './runtime/background'
import GameInfo from './runtime/gameinfo'
import Music from './runtime/music'
import DataBus from './databus'

const ctx = canvas.getContext('2d')
const databus = new DataBus()
//首先定义一下，全局变量

var lastTime = 0;//此变量用来记录上次摇动的时间

//此组变量分别记录对应x、y、z三轴的数值和上次的数值
var x=0, y = 0,  z=0, lastX =0, lastY = 0, lastZ = 0;

var shakeSpeed = 110;//设置阈值

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    // 维护当前requestAnimationFrame的id
    this.aniId = 0

    this.restart()
    wx.stopAccelerometer({
      success: (res) => {},
    })
    wx.onAccelerometerChange(this.shake)
    wx.startAccelerometer()
  }

  restart() {
    databus.reset()

    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )

    this.bg = new BackGround(ctx)
    this.player = new Player(ctx)
    this.gameinfo = new GameInfo()
    this.music = new Music()

    this.bindLoop = this.loop.bind(this)
    this.hasEventBind = false

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId)

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate() {
    if (databus.frame % 30 === 0) {
      const enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6)
      databus.enemys.push(enemy)
    }
  }

  // 全局碰撞检测
  collisionDetection() {
    const that = this

    databus.bullets.forEach((bullet) => {
      for (let i = 0, il = databus.enemys.length; i < il; i++) {
        const enemy = databus.enemys[i]

        if (!enemy.isPlaying && enemy.isCollideWith(bullet)) {
          enemy.playAnimation()
          // that.music.playExplosion()

          bullet.visible = false
          databus.score += 1

          break
        }
      }
    })

    for (let i = 0, il = databus.enemys.length; i < il; i++) {
      const enemy = databus.enemys[i]

      if (this.player.isCollideWith(enemy)) {
        databus.gameOver = true

        break
      }
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  touchEventHandler(e) {
    e.preventDefault()

    const x = e.touches[0].clientX
    const y = e.touches[0].clientY

    const area = this.gameinfo.btnArea

    if (x >= area.startX
        && x <= area.endX
        && y >= area.startY
        && y <= area.endY) this.restart()
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)

    // databus.bullets
    //   .concat(databus.enemys)
    //   .forEach((item) => {
    //     item.drawToCanvas(ctx)
    //   })

    this.player.drawToCanvas(ctx)

    databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx)
      }
    })

    this.gameinfo.renderGameScore(ctx, databus.score)

    // 游戏结束停止帧循环
    if (databus.gameOver) {
      this.gameinfo.renderGameOver(ctx, databus.score)

      if (!this.hasEventBind) {
        this.hasEventBind = true
        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
      }
    }
  }

  // 游戏逻辑更新主函数
  update() {
    if (databus.gameOver) return

    this.bg.update()

    // databus.bullets
    //   .concat(databus.enemys)
    //   .forEach((item) => {
    //     item.update()
    //   })

    // this.enemyGenerate()

    this.collisionDetection()

    if (databus.frame % 20 === 0) {
      this.player.shoot()
      // this.music.playShoot()
    }
  }

  // 实现游戏帧循环
  loop() {
    databus.frame++

    this.update()
    this.render()

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }
  //编写摇一摇方法
  shake(acceleration) {
    var nowTime = new Date().getTime();//记录当前时间
    //如果这次摇的时间距离上次摇的时间有一定间隔 才执行
    if (nowTime - lastTime > 100) {
      var diffTime = nowTime - lastTime;//记录时间段
      lastTime = nowTime;//记录本次摇动时间，为下次计算摇动时间做准备
      x = acceleration.x;//获取x轴数值，x轴为垂直于北轴，向东为正
      y = acceleration.y;//获取y轴数值，y轴向正北为正
      z = acceleration.z;//获取z轴数值，z轴垂直于地面，向上为正
      //计算 公式的意思是 单位时间内运动的路程，即为我们想要的速度
      var speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
      console.error("晃动速度："+speed)
    }
  }

}
