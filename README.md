# 🏢 不動産投資AI — 収益シミュレーター & DDレポート自動化

投資用不動産の収益計算・IRRシミュレーション・AIによるDDレポート自動生成を行うWebアプリです。

## 機能

| 機能 | 内容 |
|------|------|
| NOI・Cap Rate計算 | 管理費・修繕積立・固定資産税を個別計算 |
| IRRシミュレーション | 取得コスト・譲渡税込みの精緻な計算 |
| 感度分析 | 出口Cap率 / 空室率 / 借入金利 × IRR |
| DDレポート自動生成 | Claude APIによるストリーミング生成 |

## セットアップ

### 1. リポジトリをクローン（またはファイルを配置）

```bash
cd real-estate-ai
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. APIキーを設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して、Anthropic APIキーを入力：

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
```

APIキーは https://console.anthropic.com/ から取得できます。

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## ビルド・本番デプロイ

```bash
npm run build
npm start
```

Vercel へのデプロイ：
```bash
npx vercel
# 環境変数 ANTHROPIC_API_KEY を Vercel ダッシュボードで設定
```

## ファイル構成

```
real-estate-ai/
├── pages/
│   ├── index.jsx          # メインページ
│   ├── _app.jsx
│   └── api/
│       └── dd-report.js   # Claude API呼び出し（サーバーサイド）
├── components/
│   ├── InputPanel.jsx     # パラメータ入力スライダー
│   ├── KPICards.jsx       # NOI / Cap Rate / IRR 等
│   ├── Charts.jsx         # Recharts グラフ群
│   └── DDReport.jsx       # DDレポート生成UI
├── lib/
│   └── calc.js            # 収益計算ロジック（純粋関数）
├── styles/
│   ├── globals.css
│   └── App.module.css
└── .env.local.example
```

## 計算仕様

### NOI
```
NOI = 有効賃料 − (管理費 + 修繕積立 + 固定資産税 + 損害保険 + その他)
有効賃料 = 満室想定賃料 × (1 − 空室率)
```

### IRR
```
CF[0] = −(自己資金 + 取得諸費用)
CF[1..n-1] = FCF = NOI − 元利返済
CF[n] = FCF + (売却価格 − 残債 − 譲渡税)
```

### 感度分析
- 出口Cap率: 2.5% 〜 10.0%
- 空室率: 0% 〜 35%
- 借入金利: 0.5% 〜 4.0%
