# ORCA

ORCA 社内ポータルの新デザイン（静的モック）。AI 回答機能は含まない。

## 開き方

ビルド不要。リポジトリ直下で静的サーバーを立ててブラウザで開く。

```sh
python3 -m http.server 8000
# http://localhost:8000/
```

## 画面

| ハッシュ | 内容 |
| --- | --- |
| `#home` | ヒーロー（All connects here.）、質問欄、Agents / Library / Integrations |
| `#chat` | チャット画面（サンプル会話。送信すると吹き出しだけ追加される） |
| `#search` | エージェント・ライブラリ・連携の横断検索 |
| `#agents` | 既存サービス（競合調査、レートパリティ等）をカテゴリで絞り込み |
| `#library` | マニュアル・RM台帳・BC画像などのナレッジ |
| `#integrations` | 外部サービス連携（接続トグル） |
| `#settings` | テーマ切替（既定はライト。ダーク / 自動も選べる） |
| `#welcome` | サインイン前の画面 |

幅 860px 以下ではサイドバーがドロワーになる。

## ロゴ素材

- `assets/orca-wordmark.svg` — 支給ワードマークをベクターで描き直したもの（`currentColor` で着色、CSS ではマスクとして使用）
- `assets/orca-mark.webp` / `orca-mark.png` — 支給マーク（4096px PNG）を余白トリムして縮小
- `assets/orca-orb-soft.webp` — ヒーロー背景用にマークの暗部を淡いブルーへ寄せた版
- `assets/orca-mark-{32,64,180}.png` — favicon / apple-touch-icon
