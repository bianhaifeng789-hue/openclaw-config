#!/usr/bin/env node
/**
 * Content Generator CLI - 英语内容生成工具
 * 
 * 支持多种内容类型：
 *   - Facebook 广告文案
 *   - Google Ads 文案
 *   - TikTok 视频脚本
 *   - 邐销邮件模板
 *   - Twitter/X 帖子
 *   - LinkedIn 帖子
 * 
 * Usage:
 *   node content-generator-cli.js fb-ad --product "AdTrack Pro" --pain "tracking ROI"
 *   node content-generator-cli.js google-ad --keyword "ad analytics" --brand "AdTrack"
 *   node content-generator-cli.js tiktok --product "AdTrack" --hook "spending $1000"
 *   node content-generator-cli.js email --type promo --product "AdTrack Pro" --discount 30
 */

const fs = require('fs');
const path = require('path');

/**
 * 生成 Facebook 广告文案
 */
function generateFBAd(product, painPoint, benefits = [], cta = 'Try Free') {
  const headline = painPoint ? `${painPoint}?` : `${product} - The Solution`;
  
  const benefitList = benefits.length > 0 
    ? benefits.map(b => `• ${b}`).join('\n')
    : `• Monitor campaigns in real-time\n• ROI calculator included\n• Multi-platform support`;
  
  const adCopy = `Headline: ${headline}

Body:
✅ ${product} - Your complete solution
${benefitList}

👉 ${cta}: [link]

---
`;

  return {
    platform: 'Facebook',
    product,
    headline,
    body: adCopy,
    characterCount: adCopy.length,
    recommendations: [
      'Use high-quality image or video',
      'Test 3-5 headline variants',
      'Include social proof if available'
    ]
  };
}

/**
 * 生成 Google Ads 文案
 */
function generateGoogleAd(keyword, brand, sellingPoint = '', offer = '') {
  // Google Ads 字符限制
  const h1 = `${keyword} | ${brand}`.slice(0, 30);
  const h2 = sellingPoint ? sellingPoint.slice(0, 30) : 'Track ROI in Real-Time';
  const h3 = 'Start Today'.slice(0, 30);
  
  const d1 = `${sellingPoint || 'Monitor campaigns'}. Used by 10,000+ marketers.`.slice(0, 90);
  const d2 = offer ? `${offer}. Sign up now.`.slice(0, 90) : '30-day free trial. No card required.';
  
  const adCopy = `Headline 1: ${h1}
Headline 2: ${h2}
Headline 3: ${h3}

Description 1: ${d1}
Description 2: ${d2}

---
`;

  return {
    platform: 'Google Ads',
    keyword,
    brand,
    headlines: [h1, h2, h3],
    descriptions: [d1, d2],
    characterCount: adCopy.length,
    warnings: [
      h1.length > 30 ? '⚠️ Headline 1 exceeds 30 chars' : null,
      d1.length > 90 ? '⚠️ Description 1 exceeds 90 chars' : null
    ].filter(w => w),
    recommendations: [
      'Include numbers in headline (e.g., "10K+ users")',
      'Use call-to-action in Description 2',
      'Test multiple headline combinations'
    ]
  };
}

/**
 * 生成 TikTok 视频脚本
 */
function generateTikTokScript(product, hook, painPoint = '', demoHint = '') {
  const script = `【0-3秒】Hook:
"${hook}..."

【3-15秒】Problem:
"${painPoint || 'But you don\'t know which one works 😭'}"

【15-30秒】Solution:
"${product} shows your ROI in REAL TIME 📊"
${demoHint ? `[${demoHint}]` : '[Show interface demo]'}

【30-35秒】CTA:
"Link in bio - Free trial! 👇"

---
`;

  return {
    platform: 'TikTok',
    product,
    hook,
    script,
    totalDuration: '35 seconds',
    sections: [
      { time: '0-3s', type: 'Hook', content: hook },
      { time: '3-15s', type: 'Problem', content: painPoint },
      { time: '15-30s', type: 'Solution', content: `${product} demo` },
      { time: '30-35s', type: 'CTA', content: 'Link in bio' }
    ],
    recommendations: [
      'Use trending sound/music',
      'Fast cuts and transitions',
      'Add text overlays for key points',
      'Test different hooks (3-5 variants)'
    ]
  };
}

/**
 * 生成邐销邮件模板
 */
function generateEmail(type, product, recipientName = 'User', customData = {}) {
  let subject, body;
  
  switch (type) {
    case 'promo':
      subject = `🎁 Your exclusive ${customData.discount || 30}% discount inside`;
      body = `Hi ${recipientName},

Hope you're having a great week!

As one of our valued subscribers, we're giving you an exclusive offer:

✨ ${customData.discount || 30}% OFF ${product}

This offer includes:
• Full analytics dashboard
• ROI calculator
• Multi-platform tracking
• 24/7 support

👉 Claim your discount: [link]
(Offer expires in 48 hours)

Can't wait to help you boost your performance!

Best,
The ${product} Team
`;
      break;
      
    case 'feature':
      subject = `New feature: ${customData.featureName || 'Advanced Analytics'}`;
      body = `Hi ${recipientName},

Great news! We just launched ${customData.featureName || 'Advanced Analytics'}.

${customData.featureDesc || 'Now you can track even more metrics and get deeper insights.'}

What you can do:
• ${customData.benefit1 || 'Monitor real-time data'}
• ${customData.benefit2 || 'Custom reports'}
• ${customData.benefit3 || 'Export to Excel'}

Try it now: [link]

Happy analyzing!

Best,
The ${product} Team
`;
      break;
      
    case 'welcome':
      subject = `Welcome to ${product}! 🎉`;
      body = `Hi ${recipientName},

Welcome to ${product}! We're excited to have you.

Here's how to get started:

1. Set up your first campaign
2. Connect your ad platforms
3. Check your ROI dashboard

Quick start guide: [link]

Questions? Reply to this email anytime.

Best,
The ${product} Team
`;
      break;
      
    default:
      subject = `Update from ${product}`;
      body = `Hi ${recipientName},

We have some updates for you!

${customData.message || 'Check out our latest improvements.'}

Visit: [link]

Best,
The ${product} Team
`;
  }
  
  return {
    platform: 'Email',
    type,
    product,
    recipientName,
    subject,
    body,
    characterCount: body.length,
    recommendations: [
      'Test 2-3 subject line variants',
      'Send at optimal time (9-11am local)',
      'Personalize with first name',
      'Include clear CTA button'
    ]
  };
}

/**
 * 生成 Twitter/X 帖子
 */
function generateTwitterPost(topic, painPoint = '', solution = '', hashtags = []) {
  const defaultHashtags = ['#Marketing', '#Ads', '#ROI'];
  const finalHashtags = hashtags.length > 0 ? hashtags : defaultHashtags;
  
  const tweet = `${painPoint || 'Struggling with ad ROI?'} 📊

${solution || 'Our tool tracks all campaigns in real-time.'}

✅ Facebook + Google + TikTok
✅ ROI calculator included
✅ 30-day free trial

Try it: [link] ${finalHashtags.join(' ')}
`;

  if (tweet.length > 280) {
    return {
      platform: 'Twitter/X',
      tweet: tweet.slice(0, 280),
      originalLength: tweet.length,
      warning: '⚠️ Tweet exceeds 280 chars, truncated',
      hashtags: finalHashtags,
      recommendations: [
        'Remove hashtags if needed',
        'Shorten URL',
        'Use thread for longer content'
      ]
    };
  }
  
  return {
    platform: 'Twitter/X',
    tweet,
    characterCount: tweet.length,
    hashtags: finalHashtags,
    recommendations: [
      'Post at peak hours (9am, 12pm, 6pm)',
      'Include image/GIF for engagement',
      'Reply to comments quickly'
    ]
  };
}

/**
 * 生成 LinkedIn 帖子
 */
function generateLinkedInPost(topic, dataPoint = '', solution = '') {
  const post = `Are you maximizing your ad ROI?

📊 Key stat: ${dataPoint || '67% of marketers can\'t accurately track their ROI.'}

That's why we built ${solution || 'AdTrack'}:
• Real-time analytics
• Cross-platform tracking
• ROI optimization

See how it works: [link]

#DigitalMarketing #AdTech #ROI
`;

  return {
    platform: 'LinkedIn',
    post,
    characterCount: post.length,
    dataPoint,
    recommendations: [
      'Use professional tone',
      'Include relevant data/stat',
      'Add company logo image',
      'Engage with comments'
    ]
  };
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(JSON.stringify({
      error: '请指定命令',
      usage: 'fb-ad | google-ad | tiktok | email | twitter | linkedin',
      examples: [
        'node content-generator-cli.js fb-ad --product "AdTrack Pro"',
        'node content-generator-cli.js tiktok --product "AdTrack" --hook "POV"'
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'fb-ad':
        const productArg = args.find(a => a.startsWith('--product='));
        const painArg = args.find(a => a.startsWith('--pain='));
        const product = productArg ? productArg.split('=')[1] : '';
        const pain = painArg ? painArg.split('=')[1] : '';
        const benefits = args.find(a => a.startsWith('--benefits='))?.split('=')[1]?.split(',') || [];
        const cta = args.find(a => a.startsWith('--cta='))?.split('=')[1] || 'Try Free';
        result = generateFBAd(product, pain, benefits, cta);
        break;
        
      case 'google-ad':
        const keyword = args.find(a => a.startsWith('--keyword='))?.split('=')[1] || '';
        const brand = args.find(a => a.startsWith('--brand='))?.split('=')[1] || '';
        const sellingPoint = args.find(a => a.startsWith('--selling='))?.split('=')[1] || '';
        const offer = args.find(a => a.startsWith('--offer='))?.split('=')[1] || '';
        result = generateGoogleAd(keyword, brand, sellingPoint, offer);
        break;
        
      case 'tiktok':
        const tProduct = args.find(a => a.startsWith('--product='))?.split('=')[1] || '';
        const hook = args.find(a => a.startsWith('--hook='))?.split('=')[1] || '';
        const painPoint = args.find(a => a.startsWith('--pain='))?.split('=')[1] || '';
        const demoHint = args.find(a => a.startsWith('--demo='))?.split('=')[1] || '';
        result = generateTikTokScript(tProduct, hook, painPoint, demoHint);
        break;
        
      case 'email':
        const type = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'promo';
        const eProduct = args.find(a => a.startsWith('--product='))?.split('=')[1] || '';
        const recipient = args.find(a => a.startsWith('--recipient='))?.split('=')[1] || 'User';
        const customData = JSON.parse(args.find(a => a.startsWith('--data='))?.split('=')[1] || '{}');
        result = generateEmail(type, eProduct, recipient, customData);
        break;
        
      case 'twitter':
        const topic = args.find(a => a.startsWith('--topic='))?.split('=')[1] || '';
        const tPain = args.find(a => a.startsWith('--pain='))?.split('=')[1] || '';
        const tSolution = args.find(a => a.startsWith('--solution='))?.split('=')[1] || '';
        const hashtags = args.find(a => a.startsWith('--hashtags='))?.split('=')[1]?.split(' ') || [];
        result = generateTwitterPost(topic, tPain, tSolution, hashtags);
        break;
        
      case 'linkedin':
        const lTopic = args.find(a => a.startsWith('--topic='))?.split('=')[1] || '';
        const dataPoint = args.find(a => a.startsWith('--data='))?.split('=')[1] || '';
        const lSolution = args.find(a => a.startsWith('--solution='))?.split('=')[1] || '';
        result = generateLinkedInPost(lTopic, dataPoint, lSolution);
        break;
        
      default:
        result = { error: `未知命令: ${command}` };
    }
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }));
  }
}

// 导出供其他模块使用
module.exports = {
  generateFBAd,
  generateGoogleAd,
  generateTikTokScript,
  generateEmail,
  generateTwitterPost,
  generateLinkedInPost
};

if (require.main === module) {
  main();
}