<template>
  <div class="declaration-container">
    <div class="declaration-content">
      <BackButton />
      
      <h1>网站声明</h1>
      
      <p>本网站为个人非营利性网站，所有内容均为个人兴趣收集整理，包括但不限于小说资源、音乐资源、影视资源等。</p>
      
      <p>本站所有资源均来源于互联网公开渠道，仅用于个人学习、研究和欣赏之目的，未进行任何商业用途，也未从中获取任何经济利益。</p>
      
      <p>如您认为本站内容侵犯了您的合法权益（包括但不限于著作权、商标权、肖像权等），请及时联系我们。我们将在收到通知后第一时间核实并删除相关内容。</p>
      
      <p>感谢您的理解与支持！</p>
      
      <div class="contact-info">
        联系邮箱：1433455166@qq.com
      </div>
    </div>
  </div>
</template>

<script setup>
import BackButton from '../components/BackButton.vue'
</script>

<style scoped>
.declaration-container {
  min-height: 100vh;
  background-color: #f9f9f9;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.declaration-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
  line-height: 1.6;
  color: #333;
  position: relative;
}

.declaration-content h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 24px;
}

.declaration-content p {
  margin-bottom: 15px;
  text-align: justify;
}

.contact-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-left: 4px solid #007bff;
  margin-top: 20px;
  font-weight: bold;
  text-align: center;
}
</style>