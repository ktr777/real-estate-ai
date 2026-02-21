export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { params, results, ddReport, compareProperties, compareResults } = req.body;
  const NOTION_KEY = process.env.NOTION_API_KEY;
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;
  if (!NOTION_KEY || !DATABASE_ID) return res.status(500).json({ error: "APIキーが未設定です" });
  const fmtM = (v) => "¥" + Math.round(v/10000).toLocaleString() + "万";
  const fmtP = (v) => (v*100).toFixed(2) + "%";
  const today = new Date().toISOString().split("T")[0];

  const makeTableRow = (cells) => ({
    object: "block", type: "table_row",
    table_row: { cells: cells.map(c => [{ text: { content: String(c) } }]) }
  });

  const blocks = [
    { object: "block", type: "heading_1", heading_1: { rich_text: [{ text: { content: "投資収益シミュレーション レポート" } }] } },
    { object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: "作成日：" + today + "　エリア：" + (params.area_name||"未設定") + "　用途：" + (params.usage||"未設定") } }] } },
    { object: "block", type: "divider", divider: {} },

    { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "主要指標" } }] } },
    {
      object: "block", type: "table",
      table: {
        table_width: 2, has_column_header: true, has_row_header: false,
        children: [
          makeTableRow(["指標", "値"]),
          makeTableRow(["NOI（年間純収益）", fmtM(results.noi)]),
          makeTableRow(["Cap Rate（還元利回り）", fmtP(results.capRate)]),
          makeTableRow(["IRR（内部収益率）", fmtP(results.irr)]),
          makeTableRow(["DSCR（債務返済余力）", results.dscr.toFixed(2)]),
          makeTableRow(["Equity Multiple", results.equityMultiple.toFixed(2) + "x"]),
          makeTableRow(["FCF（年間）", fmtM(results.fcf)]),
          makeTableRow(["自己資金合計", fmtM(results.totalEquity)]),
          makeTableRow(["借入額", fmtM(results.loanAmount)]),
          makeTableRow(["想定売却価格", fmtM(results.exitPrice)]),
          makeTableRow(["売却手取り", fmtM(results.exitProceeds)]),
        ]
      }
    },
    { object: "block", type: "divider", divider: {} },

    { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "年次キャッシュフロー" } }] } },
    {
      object: "block", type: "table",
      table: {
        table_width: 5, has_column_header: true, has_row_header: false,
        children: [
          makeTableRow(["年次", "NOI", "元利返済", "FCF", "残債"]),
          ...(results.yearlyData||[]).slice(0,10).map(row =>
            makeTableRow([row.year + "年目", fmtM(row.NOI), fmtM(row.元利返済), fmtM(row.FCF), fmtM(row.残債)])
          )
        ]
      }
    },
    { object: "block", type: "divider", divider: {} },
  ];

  if (compareProperties && compareResults && compareProperties.length > 1) {
    const cols = compareProperties.length + 2;
    blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "物件比較" } }] } });
    blocks.push({
      object: "block", type: "table",
      table: {
        table_width: cols, has_column_header: true, has_row_header: false,
        children: [
          makeTableRow(["指標", ...compareProperties.map(p => p.name||"物件"), "最優位"]),
          ...["NOI", "Cap Rate", "IRR", "DSCR", "Equity×", "FCF"].map(metric => {
            const vals = compareResults.map(r => {
              if (metric === "NOI") return fmtM(r.noi);
              if (metric === "Cap Rate") return fmtP(r.capRate);
              if (metric === "IRR") return fmtP(r.irr);
              if (metric === "DSCR") return r.dscr.toFixed(2);
              if (metric === "Equity×") return r.equityMultiple.toFixed(2) + "x";
              if (metric === "FCF") return fmtM(r.fcf);
              return "-";
            });
            const nums = compareResults.map(r => {
              if (metric === "NOI") return r.noi;
              if (metric === "Cap Rate") return r.capRate;
              if (metric === "IRR") return r.irr;
              if (metric === "DSCR") return r.dscr;
              if (metric === "Equity×") return r.equityMultiple;
              if (metric === "FCF") return r.fcf;
              return 0;
            });
            const bestIdx = nums.indexOf(Math.max(...nums));
            return makeTableRow([metric, ...vals, compareProperties[bestIdx].name||"物件" + (bestIdx+1)]);
          })
        ]
      }
    });
    blocks.push({ object: "block", type: "divider", divider: {} });
  }

  if (ddReport) {
    blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "AI DDレポート" } }] } });
    const chunks = ddReport.match(/.{1,1900}/gs) || [];
    chunks.forEach(chunk => {
      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: chunk } }] } });
    });
  }

  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": "Bearer " + NOTION_KEY, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: {
          "エリア": { title: [{ text: { content: (params.area_name||"物件") + " " + today } }] },
          "用途": { rich_text: [{ text: { content: params.usage||"" } }] },
          "物件価格（万円）": { number: Math.round(params.price/10000) },
          "NOI（万円）": { number: Math.round(results.noi/10000) },
          "Cap Rate（%）": { number: parseFloat((results.capRate*100).toFixed(2)) },
          "IRR（%）": { number: parseFloat((results.irr*100).toFixed(2)) },
          "DSCR": { number: parseFloat(results.dscr.toFixed(2)) },
          "作成日": { date: { start: today } },
        },
        children: blocks.slice(0, 100)
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.message||"Notion APIエラー" });
    return res.status(200).json({ url: data.url, id: data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}