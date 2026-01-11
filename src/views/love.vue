<template>
  <div style="background-color: black">
    <canvas ref="canvas" width="100%" height="100%"></canvas>
  </div>
</template>

<script>
export default {
  mounted() {
    var hearts = [];
    var wW = window.innerWidth;
    var wH = window.innerHeight;
    // 创建画布
    var ctx = this.$refs?.canvas.getContext("2d");
    console.log(ctx);
    // 创建图片对象
    var heartImage = new Image();
    heartImage.src =
      "https://img1.baidu.com/it/u=605316250,3131138278&fm=253&fmt=auto&app=138&f=PNG?w=500&h=500";
    var num = 100;
    // 初始化画布大小
    this.$refs.canvas.width = wW;
    this.$refs.canvas.height = wH;
    for (var i = 0; i < num; i++) {
      hearts.push(new Heart(i % 5));
    }
    requestAnimationFrame(render);

    window.addEventListener("resize", function () {
      wW = window.innerWidth;
      wH = window.innerHeight;
    });

    function getColor() {
      var val = Math.random() * 10;
      if (val > 0 && val <= 1) {
        return "#00f";
      } else if (val > 1 && val <= 2) {
        return "#f00";
      } else if (val > 2 && val <= 3) {
        return "#0f0";
      } else if (val > 3 && val <= 4) {
        return "#368";
      } else if (val > 4 && val <= 5) {
        return "#666";
      } else if (val > 5 && val <= 6) {
        return "#333";
      } else if (val > 6 && val <= 7) {
        return "#f50";
      } else if (val > 7 && val <= 8) {
        return "#e96d5b";
      } else if (val > 8 && val <= 9) {
        return "#5be9e9";
      } else {
        return "#d41d50";
      }
    }

    // 获取随机文字
    function getText() {

        const textArray = [
            "爱你一辈子！",
            "亲爱的，爱你！",
            "喜欢你！",
            "爱你到永远，亲爱的！",
            "爱你，是我的幸福！",
            "爱你，是我的光！",
            "一辈子，只爱你！",
            "心里住着你，哪儿都不去！",
            "想你，是今天的小习惯！",
            "喜欢你，藏不住了！",
            "你是我的光，我的暖！",
            "爱你如初，岁岁年年！",
            "一见你，心就软了！",
            "余生，请多指教！",
            "有你在，就是家！",
            "你是我生命中的一部分！",
            "你是我最爱的人！",

            "I Love You!",
            'I love you, today and always!',
            'Crazy in love with you!',
            'My heart is yours!',
        ];
        const randomIndex = Math.floor(Math.random() * textArray.length);
        return textArray[randomIndex];
    }

    function Heart(type) {
      this.type = type;
      // 初始化生成范围
      this.x = Math.random() * wW;
      this.y = Math.random() * wH;

      this.opacity = Math.random() * 0.5 + 0.5;

      // 偏移量
      this.vel = {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5,
      };

      this.initialW = wW * 0.5;
      this.initialH = wH * 0.5;
      // 缩放比例
      this.targetScale = Math.random() * 0.15 + 0.02; // 最小0.02
      this.scale = Math.random() * this.targetScale;

      // 文字位置
      this.fx = Math.random() * wW;
      this.fy = Math.random() * wH;
      this.fs = Math.random() * 10;
      this.text = getText();

      this.fvel = {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5,
        f: (Math.random() - 0.5) * 2,
      };
    }

    Heart.prototype.draw = function () {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(heartImage, this.x, this.y, this.width, this.height);
      ctx.scale(this.scale + 1, this.scale + 1);
      if (!this.type) {
        // 设置文字属性
        ctx.fillStyle = getColor();
        ctx.font = "italic " + this.fs + "px sans-serif";
        // 填充字符串
        ctx.fillText(this.text, this.fx, this.fy);
      }
      ctx.restore();
    };
    Heart.prototype.update = function () {
      this.x += this.vel.x;
      this.y += this.vel.y;

      if (this.x - this.width > wW || this.x + this.width < 0) {
        // 重新初始化位置
        this.scale = 0;
        this.x = Math.random() * wW;
        this.y = Math.random() * wH;
      }
      if (this.y - this.height > wH || this.y + this.height < 0) {
        // 重新初始化位置
        this.scale = 0;
        this.x = Math.random() * wW;
        this.y = Math.random() * wH;
      }

      // 放大
      this.scale += (this.targetScale - this.scale) * 0.1;
      this.height = this.scale * this.initialH;
      this.width = this.height * 1.4;

      // -----文字-----
      this.fx += this.fvel.x;
      this.fy += this.fvel.y;
      this.fs += this.fvel.f;

      if (this.fs > 50) {
        this.fs = 2;
      }

      if (this.fx - this.fs > wW || this.fx + this.fs < 0) {
        // 重新初始化位置
        this.fx = Math.random() * wW;
        this.fy = Math.random() * wH;
      }
      if (this.fy - this.fs > wH || this.fy + this.fs < 0) {
        // 重新初始化位置
        this.fx = Math.random() * wW;
        this.fy = Math.random() * wH;
      }
    };

    function render() {
      ctx.clearRect(0, 0, wW, wH);
      for (var i = 0; i < hearts.length; i++) {
        hearts[i].draw();
        hearts[i].update();
      }
      requestAnimationFrame(render);
    }
  },
};
</script>

<style lang="postcss" scoped></style>
