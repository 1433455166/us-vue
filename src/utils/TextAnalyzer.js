export class TextAnalyzer {
  constructor(text = '') {
    this.text = text;
  }
  
  setText(text) {
    this.text = text;
    return this;
  }
  
  // 总字符数
  get totalChars() {
    return this.text.length;
  }
  
  // 纯中文字数（不含标点）
  get chineseOnly() {
    return (this.text.match(/[\u4E00-\u9FFF]/g) || []).length;
  }
  
  // 中文字符（含中文标点）
  get chineseWithPunctuation() {
    return (this.text.match(/[\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/g) || []).length;
  }
  
  // 阅读时间估算（字/分钟）
  get readingTime() {
    const wordsPerMinute = 300; // 中文阅读速度
    return Math.ceil(this.chineseWithPunctuation / wordsPerMinute);
  }
  
  // 朗读时间估算（字/分钟）
  get speakingTime() {
    const wordsPerMinute = 200; // 中文朗读速度
    return Math.ceil(this.chineseWithPunctuation / wordsPerMinute);
  }
  
  // 获取词频统计
  getWordFrequency(limit = 10) {
    const words = this.text.match(/[\u4E00-\u9FFF]{2,}/g) || [];
    const frequency = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }
  
  // 获取详细报告
  getReport() {
    return {
      总字符数: this.totalChars,
      中文字数: this.chineseOnly,
      含标点字数: this.chineseWithPunctuation,
      阅读时间: `${this.readingTime} 分钟`,
      朗读时间: `${this.speakingTime} 分钟`,
      段落数: this.text.split(/\n\s*\n/).filter(p => p.trim()).length,
      高频词汇: this.getWordFrequency(5)
    };
  }
}

// 使用示例
// const analyzer = new TextAnalyzer(你的文本);
// console.log(analyzer.getReport());