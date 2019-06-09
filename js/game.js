(function initGame(states, keyNumber, r) {
  function loadModule(modules, u) {
    if (!keyNumber[modules]) {
      if (!states[modules]) {
        var a = typeof require == "function" && require;
        if (!u && a) return a(modules, !0);
        if (i) return i(modules, !0);
        throw new Error("Cannot find module '" + modules + "'")
      }
      var f = keyNumber[modules] = { exports: {} };
      states[modules][0].call(f.exports, function (initGame) {
        var keyNumber = states[modules][1][initGame];
        return loadModule(keyNumber ? keyNumber : initGame)
      }, f, f.exports, initGame, states, keyNumber, r)
    }
    return keyNumber[modules].exports
  }
  var i = typeof require == "function" && require;
  for (var modules = 0; modules < r.length; modules++) {
    loadModule(r[modules])
  };
  return loadModule
})
({
  1: [function (require, module, exports) {
    'use strict';


    var BootState = require('./states/boot');
    var MenuState = require('./states/menu');
    var PlayState = require('./states/play');
    var PreloadState = require('./states/preload');

    var game = new Phaser.Game(400, 650, Phaser.AUTO, 'lepsFly');

    // Estados del juego
    game.state.add('boot', BootState);
    game.state.add('menu', MenuState);
    game.state.add('play', PlayState);
    game.state.add('preload', PreloadState);


    game.state.start('boot');


  }, { "./states/boot": 7, "./states/menu": 8, "./states/play": 9, "./states/preload": 10 }], 
  
  2: [function (require, module, exports) {
    'use strict';

    var Me = function (game, x, y, frame) {
      Phaser.Sprite.call(this, game, x, y, 'me', frame);
      this.anchor.setTo(0.5, 0.5);
      this.animations.add('flap');
      this.animations.play('flap', 12, true);

      this.flapSound = this.game.add.audio('flap');

      this.name = 'me';
      this.alive = false;
      this.onGround = false;

      // habilitamos fisicas para me
      // desabilitamos gravedad para me hasta que pulsemos start
      this.game.physics.arcade.enableBody(this);
      this.body.allowGravity = false;
      this.body.collideWorldBounds = true;


      this.events.onKilled.add(this.onKilled, this);



    };

    Me.prototype = Object.create(Phaser.Sprite.prototype);
    Me.prototype.constructor = Me;

    Me.prototype.update = function () {
      // comprobamos que el angulo sea menor de 90
      // si lo es giramos el sprite me 2.5 mirando al suelo
      if (this.angle < 90 && this.alive) {
        this.angle += 2.5;
      }

      if (!this.alive) {
        this.body.velocity.x = 0;
      }
    };

    Me.prototype.flap = function () {
      if (!!this.alive) {
        this.flapSound.play();
        //impulso en el eje y
        this.body.velocity.y = -400;
        // giramos 40 grados en la caida
        this.game.add.tween(this).to({ angle: -40 }, 100).start();
      }
    };

    Me.prototype.revived = function () {
    };

    Me.prototype.onKilled = function () {
      this.exists = true;
      this.visible = true;
      this.animations.stop();
      var duration = 90 / this.y * 300;
      this.game.add.tween(this).to({ angle: 90 }, duration).start();
      console.log('killed');
      console.log('alive:', this.alive);
    };

    module.exports = Me;


  }, {}],

  
  3: [function (require, module, exports) {
    'use strict';

    var Ground = function (game, x, y, width, height) {
      Phaser.TileSprite.call(this, game, x, y, width, height, 'ground');
      // hacemos que el suelo se mueva horizontalmente
      this.autoScroll(-200, 0);

      // habilitamos las fisicas del suelo para activar la colision por caida
      this.game.physics.arcade.enableBody(this);

      // we don't want the ground's body
      // to be affected by gravity or external forces
      this.body.allowGravity = false;
      this.body.immovable = true;


    };

    Ground.prototype = Object.create(Phaser.TileSprite.prototype);
    Ground.prototype.constructor = Ground;

    Ground.prototype.update = function () {



    };

    module.exports = Ground;
  }, {}], 
  
  4: [function (require, module, exports) {
    'use strict';

    var Obstacles = function (game, x, y, frame) {
      Phaser.Sprite.call(this, game, x, y, 'obstacles', frame);
      this.anchor.setTo(0.5, 0.5);
      this.game.physics.arcade.enableBody(this);

      this.body.allowGravity = false;
      this.body.immovable = true;

    };

    Obstacles.prototype = Object.create(Phaser.Sprite.prototype);
    Obstacles.prototype.constructor = Obstacles;

    Obstacles.prototype.update = function () {


    };

    module.exports = Obstacles;
  }, {}],
  
  5: [function (require, module, exports) {
    'use strict';

    var Obstacles = require('./obstacles');

    var ObstaclesGroup = function (game, parent) {
      //controlamos el punto de inserción de los obstaculos 
      Phaser.Group.call(this, game, parent);

      this.topObstacles = new Obstacles(this.game, 0, 0, 0);
      this.bottomObstacles = new Obstacles(this.game, 0, 440, 1);
      this.add(this.topObstacles);
      this.add(this.bottomObstacles);
      this.hasScored = false;

      this.setAll('body.velocity.x', -200);
    };

    ObstaclesGroup.prototype = Object.create(Phaser.Group.prototype);
    ObstaclesGroup.prototype.constructor = ObstaclesGroup;

    ObstaclesGroup.prototype.update = function () {
      this.checkWorldBounds();
    };

    ObstaclesGroup.prototype.checkWorldBounds = function () {
      if (!this.topObstacles.inWorld) {
        this.exists = false;
      }
    };


    ObstaclesGroup.prototype.reset = function (x, y) {
      this.topObstacles.reset(0, 0);
      this.bottomObstacles.reset(0, 470);
      this.x = x;
      this.y = y;
      this.setAll('body.velocity.x', -200);
      this.hasScored = false;
      this.exists = true;
    };


    ObstaclesGroup.prototype.stop = function () {
      this.setAll('body.velocity.x', 0);
    };

    module.exports = ObstaclesGroup;
  }, { "./obstacles": 4 }],
  
  6: [function (require, module, exports) {
    'use strict';

    var Scoreboard = function (game) {

      var gameover;

      Phaser.Group.call(this, game);
      gameover = this.create(this.game.width / 2, 100, 'gameover');
      gameover.anchor.setTo(0.5, 0.5);

      this.scoreboard = this.create(this.game.width / 2, 200, 'scoreboard');
      this.scoreboard.anchor.setTo(0.5, 0.5);

      this.scoreText = this.game.add.bitmapText(this.scoreboard.width, 180, 'flappyfont', '', 18);
      this.add(this.scoreText);

      this.bestText = this.game.add.bitmapText(this.scoreboard.width, 230, 'flappyfont', '', 18);
      this.add(this.bestText);

      // botón de start
      this.startButton = this.game.add.button(this.game.width / 2, 300, 'startButton', this.startClick, this);
      this.startButton.anchor.setTo(0.5, 0.5);

      this.add(this.startButton);

      this.y = this.game.height;
      this.x = 0;

    };

    Scoreboard.prototype = Object.create(Phaser.Group.prototype);
    Scoreboard.prototype.constructor = Scoreboard;

    Scoreboard.prototype.show = function (score) {
      var coin, bestScore;
      this.scoreText.setText(score.toString());
      if (!!localStorage) {
        bestScore = localStorage.getItem('bestScore');
        if (!bestScore || bestScore < score) {
          bestScore = score;
          localStorage.setItem('bestScore', bestScore);
        }
      } else {
        bestScore = 'N/A';
      }

      this.bestText.setText(bestScore.toString());

      if (score >= 10 && score < 20) {
        coin = this.game.add.sprite(-65, 7, 'medals', 0);
      }
      else if (score >= 20) {
        coin = this.game.add.sprite(-65, 7, 'medals', 1);
      }

      this.game.add.tween(this).to({ y: 0 }, 1000, Phaser.Easing.Bounce.Out, true);

      if (coin) {

        coin.anchor.setTo(0.5, 0.5);
        this.scoreboard.addChild(coin);

        var emitter = this.game.add.emitter(coin.x, coin.y, 400);
        this.scoreboard.addChild(emitter);
        emitter.width = coin.width;
        emitter.height = coin.height;




        emitter.makeParticles('particle');



        emitter.setRotation(-100, 100);
        emitter.setXSpeed(0, 0);
        emitter.setYSpeed(0, 0);
        emitter.minParticleScale = 0.25;
        emitter.maxParticleScale = 0.5;
        emitter.setAll('body.allowGravity', false);

        emitter.start(false, 1000, 1000);

      }
    };

    Scoreboard.prototype.startClick = function () {
      this.game.state.start('play');
    };




    //actualización de puntuaciones
    Scoreboard.prototype.update = function () {

    };

    module.exports = Scoreboard;

  }, {}],
   
  7: [function (require, module, exports) {

    'use strict';

    function Boot() {
    }

    Boot.prototype = {
      preload: function () {
        this.load.image('preloader', 'assets/preloader.gif');
      },
      create: function () {
        this.game.input.maxPointers = 1;
        this.game.state.start('preload');
      }
    };
    //stado antes de comenzar a jugar
    module.exports = Boot;

  }, {}],
  
  8: [function (require, module, exports) {

    'use strict';
    function Menu() { }

    Menu.prototype = {
      preload: function () {

      },
      create: function () {
        // agregamos el fondo
        this.background = this.game.add.sprite(0, 0, 'background');

        // agregamos el tile del suelo y hacemos que deslice en -x
        this.ground = this.game.add.tileSprite(0, 550, 550, 112, 'ground');
        this.ground.autoScroll(-200, 0);


        this.titleGroup = this.game.add.group()


        // creamos el sprite de título

        this.title = this.add.sprite(0, 0, 'title');
        this.titleGroup.add(this.title);


        // creamos el sprite del protagonista que soy yo :)  

        this.me = this.add.sprite(200, 5, 'me');
        this.titleGroup.add(this.me);


        // creamos la animacíon del sprite 
        this.me.animations.add('flap');
        this.me.animations.play('flap', 12, true);


        //coordenadas del titulo (contiene una copia del sprite me)
        this.titleGroup.x = 30;
        this.titleGroup.y = 100;


        this.game.add.tween(this.titleGroup).to({ y: 115 }, 350, Phaser.Easing.Linear.NONE, true, 0, 1000, true);

        // agregamos el start ahora con parametros de ubicación
        this.startButton = this.game.add.button(this.game.width / 2, 300, 'startButton', this.startClick, this);
        this.startButton.anchor.setTo(0.5, 0.5);
      },
      startClick: function () {
        // creamos el handler del click del start
        this.game.state.start('play');
      }
    };

    module.exports = Menu;

  }, {}],

   9: [function (require, module, exports) {

    'use strict';
    var Me = require('../prefabs/me');
    var Ground = require('../prefabs/ground');
    var Obstacles = require('../prefabs/obstacles');
    var ObstaclesGroup = require('../prefabs/obstaclesGroup');
    var Scoreboard = require('../prefabs/scoreboard');

    function Play() {
    }
    Play.prototype = {
      create: function () {
        // arrancamos las fisicas heredadas de la libreria phaser
        this.game.physics.startSystem(Phaser.Physics.ARCADE);


        // asignamos una gravedad de 1200 (velocidad -y)
        this.game.physics.arcade.gravity.y = 1200;

        // agregamos al estado el background 
        this.background = this.game.add.sprite(0, 0, 'background');

        // agregamos el grupo de obstaculos
        this.obstacles = this.game.add.group();

        // posicionamos el sprite del tio guapo para empezar
        this.me = new Me(this.game, 100, this.game.height / 2);
        this.game.add.existing(this.me);



        // create and add a new Ground object
        this.ground = new Ground(this.game, 0, 530, 532, 212);
        this.game.add.existing(this.ground);


        // permitimos la barra espaciadora como control en ligar del click
        this.flapKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.flapKey.onDown.addOnce(this.startGame, this);
        this.flapKey.onDown.add(this.me.flap, this.me);


        // agregamos el control de raton 
        this.game.input.onDown.addOnce(this.startGame, this);
        this.game.input.onDown.add(this.me.flap, this.me);
        this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);



        this.score = 0;
        this.scoreText = this.game.add.bitmapText(this.game.width / 2, 10, 'flappyfont', this.score.toString(), 24);

        this.instructionGroup = this.game.add.group();
        this.instructionGroup.add(this.game.add.sprite(this.game.width / 2, 100, 'getReady'));
        this.instructionGroup.add(this.game.add.sprite(this.game.width / 2, 325, 'instructions'));
        this.instructionGroup.setAll('anchor.x', 0.5);
        this.instructionGroup.setAll('anchor.y', 0.5);

        this.obstaclesGenerator = null;

        this.gameover = false;

        this.obstaclesHitSound = this.game.add.audio('obstaclesHit');
        this.groundHitSound = this.game.add.audio('groundHit');
        this.scoreSound = this.game.add.audio('score');

      },
      update: function () {
        // habilitamos la colisiones con el suelo
        this.game.physics.arcade.collide(this.me, this.ground, this.deathHandler, null, this);

        if (!this.gameover) {
          // habilitamos las colisiones con los obstaculos
          this.obstacles.forEach(function (obstaclesGroup) {
            this.checkScore(obstaclesGroup);
            this.game.physics.arcade.collide(this.me, obstaclesGroup, this.deathHandler, null, this);
          }, this);
        }



      },
      shutdown: function () {
        this.game.input.keyboard.removeKey(Phaser.Keyboard.SPACEBAR);
        this.me.destroy();
        this.obstacles.destroy();
        this.scoreboard.destroy();
      },
      startGame: function () {
        if (!this.me.alive && !this.gameover) {
          this.me.body.allowGravity = true;
          this.me.alive = true;
          // generamos un temporizador para manejar la frecuencia de aparición de obstaculos
          this.obstaclesGenerator = this.game.time.events.loop(Phaser.Timer.SECOND * 1.25, this.generateObstacles, this);
          this.obstaclesGenerator.timer.start();

          this.instructionGroup.destroy();
        }
      },
      checkScore: function (obstaclesGroup) {
        if (obstaclesGroup.exists && !obstaclesGroup.hasScored && obstaclesGroup.topObstacles.world.x <= this.me.world.x) {
          obstaclesGroup.hasScored = true;
          this.score++;
          this.scoreText.setText(this.score.toString());
          this.scoreSound.play();
        }
      },
      deathHandler: function (me, enemy) {
        if (enemy instanceof Ground && !this.me.onGround) {
          this.groundHitSound.play();
          this.scoreboard = new Scoreboard(this.game);
          this.game.add.existing(this.scoreboard);
          this.scoreboard.show(this.score);
          this.me.onGround = true;
        } else if (enemy instanceof Obstacles) {
          this.obstaclesHitSound.play();
        }

        if (!this.gameover) {
          this.gameover = true;
          this.me.kill();
          this.obstacles.callAll('stop');
          this.obstaclesGenerator.timer.stop();
          this.ground.stopScroll();
        }

      },
      generateObstacles: function () {
        var obstaclesY = this.game.rnd.integerInRange(-100, 100);
        var obstaclesGroup = this.obstacles.getFirstExists(false);
        if (!obstaclesGroup) {
          obstaclesGroup = new ObstaclesGroup(this.game, this.obstacles);
        }
        obstaclesGroup.reset(this.game.width, obstaclesY);


      }
    };

    module.exports = Play;

  }, { "../prefabs/me": 2, "../prefabs/ground": 3, "../prefabs/obstacles": 4, "../prefabs/obstaclesGroup": 5, "../prefabs/scoreboard": 6 }], 10: [function (require, module, exports) {

    'use strict';
    function Preload() {
      this.asset = null;
      this.ready = false;
    }

    Preload.prototype = {
      preload: function () {
        this.asset = this.add.sprite(this.width / 2, this.height / 2, 'preloader');
        this.asset.anchor.setTo(0.5, 0.5);

        this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
        this.load.setPreloadSprite(this.asset);
        this.load.image('background', 'assets/background.png');
        this.load.image('ground', 'assets/ground.png');
        this.load.image('title', 'assets/title.png');
        this.load.spritesheet('me', 'assets/me.png', 68, 48, 3);
        this.load.spritesheet('obstacles', 'assets/obstacles.png', 54, 320, 2);
        this.load.image('startButton', 'assets/start-button.png');

        this.load.image('instructions', 'assets/instructions.png');
        this.load.image('getReady', 'assets/get-ready.png');

        this.load.image('scoreboard', 'assets/scoreboard.png');
        this.load.spritesheet('medals', 'assets/medals.png', 44, 46, 2);
        this.load.image('gameover', 'assets/gameover.png');
        this.load.image('particle', 'assets/particle.png');

        this.load.audio('flap', 'assets/flap.wav');
        this.load.audio('obstaclesHit', 'assets/obstacles-hit.wav');
        this.load.audio('groundHit', 'assets/ground-hit.wav');
        this.load.audio('score', 'assets/score.wav');
        this.load.audio('ouch', 'assets/ouch.wav');

        this.load.bitmapFont('flappyfont', 'assets/fonts/flappyfont/flappyfont.png', 'assets/fonts/flappyfont/flappyfont.fnt');

      },
      create: function () {
        this.asset.cropEnabled = false;
      },
      update: function () {
        if (!!this.ready) {
          this.game.state.start('menu');
        }
      },
      onLoadComplete: function () {
        this.ready = true;
      }
    };

    module.exports = Preload;

  }, {}]
}, {}, [1])