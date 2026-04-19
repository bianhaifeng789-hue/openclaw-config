---
name: company-registration
description: |
  公司注册资料准备技能
  
  功能：
  - 公司信息模板生成
  - 银行账户信息准备
  - 地址证明生成
  - 营业执照准备
  
  Use when:
  - 准备公司注册资料
  - 准备银行开户资料
  - 准备平台注册资料
  
  Keywords:
  - 公司注册, 银行开户, 地址证明, 营业执照
---

# 公司注册资料准备

## 公司信息模板

```json
{
  "companyInfo": {
    "legalName": "Company Name LLC",
    "displayName": "Company Name",
    "type": "LLC",
    "registrationNumber": "",
    "registrationDate": "",
    "registrationCountry": "US",
    "taxId": ""
  },
  "address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US"
  },
  "contact": {
    "email": "info@company.com",
    "phone": "+1-XXX-XXX-XXXX",
    "website": "https://company.com"
  },
  "representative": {
    "name": "John Doe",
    "title": "CEO",
    "email": "john@company.com",
    "phone": "+1-XXX-XXX-XXXX"
  }
}
```

## 银行账户信息

### 美国银行账户
```json
{
  "bankInfo": {
    "bankName": "Bank of America",
    "accountType": "Business Checking",
    "accountNumber": "XXXXX",
    "routingNumber": "XXXXX",
    "swiftCode": "BOFAUS3N"
  }
}
```

### 地址证明要求
- 银行账单（最近3个月）
- 水电账单（最近3个月）
- 租赁合同
- 公司注册证书

## 营业执照准备

### 美国公司
- 注册州政府颁发
- 包含公司名称
- 包含注册日期
- 包含注册号

### 其他国家公司
- 本国营业执照
- 翻译公证
- 公司章程

## 平台注册资料清单

### Google Play开发者
```
✅ Google账号
✅ $25注册费
✅ 公司名称
✅ 联系地址
✅ 联系邮箱
✅ 联系电话
✅ D-U-N-S编号（可选）
```

### AdMob账号
```
✅ Google账号
✅ 公司名称
✅ 联系地址
✅ 银行账户信息
✅ W-8BEN-E税务表格
```