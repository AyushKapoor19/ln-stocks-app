import { Lightning } from "@lightningjs/sdk";

export default class GalaxyBackground extends Lightning.Component {
  private stars: any[] = [];

  static _template() {
    return {
      w: 1920,
      h: 1080,
      rect: true,

      // Deep space gradient background
      SpaceGradient: {
        w: 1920,
        h: 1080,
        rect: true,
        colorTop: 0xff0a0f1c,
        colorBottom: 0xff000000,
      },

      // Nebula overlays for galaxy effect
      Nebula1: {
        x: 300,
        y: 200,
        w: 800,
        h: 600,
        rect: true,
        color: 0x0800d4ff, // Very transparent teal
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: 400,
        },
        alpha: 0.1,
      },

      Nebula2: {
        x: 1000,
        y: 400,
        w: 600,
        h: 400,
        rect: true,
        color: 0x0500a8cc, // Very transparent blue
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: 300,
        },
        alpha: 0.08,
      },

      Nebula3: {
        x: 100,
        y: 600,
        w: 500,
        h: 300,
        rect: true,
        color: 0x0300d27a, // Very transparent green
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: 250,
        },
        alpha: 0.05,
      },

      // Animated stars container
      StarsContainer: {
        w: 1920,
        h: 1080,
      },
    };
  }

  _init() {
    this.createAnimatedStars();
    this.startGalaxyAnimations();
  }

  private createAnimatedStars() {
    const starsContainer = this.tag("StarsContainer");
    if (!starsContainer) return;

    const starCount = 120;
    const stars: any[] = [];

    for (let i = 0; i < starCount; i++) {
      const size = Math.random() * 3 + 1;
      const brightness = Math.random() * 0.8 + 0.2;

      stars.push({
        ref: `Star_${i}`,
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        w: size,
        h: size,
        rect: true,
        color: 0xffffffff,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: size / 2 },
        alpha: brightness,
        mount: 0.5,
      });
    }

    starsContainer.children = stars;
    this.stars = stars;
  }

  private startGalaxyAnimations() {
    // Animate nebulas with slow breathing effect
    this.animateNebulas();

    // Animate stars with twinkling
    this.animateStars();

    // Add some movement to nebulas
    this.animateNebulaMovement();
  }

  private animateNebulas() {
    const nebula1 = this.tag("Nebula1");
    const nebula2 = this.tag("Nebula2");
    const nebula3 = this.tag("Nebula3");

    // Nebula 1 - slow pulse
    if (nebula1) {
      this.createLoopAnimation(() => {
        nebula1.setSmooth("alpha", 0.2, { duration: 4 });
        setTimeout(() => {
          nebula1.setSmooth("alpha", 0.05, { duration: 4 });
        }, 4000);
      }, 8000);
    }

    // Nebula 2 - slower pulse, offset
    if (nebula2) {
      setTimeout(() => {
        this.createLoopAnimation(() => {
          nebula2.setSmooth("alpha", 0.15, { duration: 6 });
          setTimeout(() => {
            nebula2.setSmooth("alpha", 0.03, { duration: 6 });
          }, 6000);
        }, 12000);
      }, 2000);
    }

    // Nebula 3 - very slow pulse
    if (nebula3) {
      setTimeout(() => {
        this.createLoopAnimation(() => {
          nebula3.setSmooth("alpha", 0.1, { duration: 8 });
          setTimeout(() => {
            nebula3.setSmooth("alpha", 0.02, { duration: 8 });
          }, 8000);
        }, 16000);
      }, 4000);
    }
  }

  private animateStars() {
    this.stars.forEach((_, index) => {
      const star = this.tag("StarsContainer")?.tag(`Star_${index}`);
      if (star) {
        const delay = Math.random() * 5000; // Random start delay
        const minAlpha = Math.random() * 0.2 + 0.1;
        const maxAlpha = Math.random() * 0.6 + 0.4;
        const duration = Math.random() * 3000 + 2000; // 2-5 seconds

        setTimeout(() => {
          this.createLoopAnimation(() => {
            star.setSmooth("alpha", maxAlpha, { duration: duration / 2 });
            setTimeout(() => {
              star.setSmooth("alpha", minAlpha, { duration: duration / 2 });
            }, duration / 2);
          }, duration);
        }, delay);
      }
    });
  }

  private animateNebulaMovement() {
    // Very slow drift for nebulas
    const nebula1 = this.tag("Nebula1");
    const nebula2 = this.tag("Nebula2");

    if (nebula1) {
      this.createLoopAnimation(() => {
        nebula1.setSmooth("x", 350, { duration: 20 });
        setTimeout(() => {
          nebula1.setSmooth("x", 250, { duration: 20 });
        }, 20000);
      }, 40000);
    }

    if (nebula2) {
      setTimeout(() => {
        this.createLoopAnimation(() => {
          nebula2.setSmooth("y", 450, { duration: 25 });
          setTimeout(() => {
            nebula2.setSmooth("y", 350, { duration: 25 });
          }, 25000);
        }, 50000);
      }, 10000);
    }
  }

  private createLoopAnimation(animationFn: () => void, interval: number) {
    animationFn(); // Run immediately
    setInterval(animationFn, interval);
  }

  _active() {
    // Restart animations when component becomes active
    setTimeout(() => {
      this.startGalaxyAnimations();
    }, 500);
  }
}
