import { Team, HistoryItem, GameState } from '../types';

/**
 * Generates an Excel-compatible CSV file of the current scoreboard and match logs.
 */
export function exportToCSV(teams: Team[], scores: Record<number, number>, history: HistoryItem[]) {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Section 1: Final Scoreboard
  csvContent += "LCC PRO SCORING SYSTEM - FINAL STANDINGS\n";
  csvContent += "Rank,Team Name,Seat Position,Final Score\n";
  
  const sortedTeams = [...teams].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  sortedTeams.forEach((team, idx) => {
    csvContent += `"${idx + 1}","${team.name}","Seat ${team.seat}","${scores[team.id] || 0}"\n`;
  });
  
  csvContent += "\n\n";
  
  // Section 2: Match History Log
  csvContent += "DETAILED MATCH LOGS\n";
  csvContent += "Timestamp,Round,Question #,Team,Score Change,Action / Reason,Details\n";
  
  history.forEach(item => {
    const timeStr = new Date(item.timestamp).toLocaleTimeString();
    csvContent += `"${timeStr}","${item.round}","${item.questionNumber}","${item.teamName}","${item.scoreChange > 0 ? '+' : ''}${item.scoreChange}","${item.reason}","${item.details || ''}"\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `lcc_match_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates an elegant Excel-XML formatted spreadsheet which supports worksheet tabs
 * and rich styling, opening natively in MS Excel.
 */
export function exportToExcelXML(gameState: GameState) {
  const { teams, scores, history, settings } = gameState;
  const sortedTeams = [...teams].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${settings.competitionName}</Title>
  <Subject>${settings.eventName}</Subject>
  <Author>${settings.operatorName}</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#D4AF37"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ScoreStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Standings">
  <Table>
   <Column ss:Width="60"/>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   
   <Row ss:Height="30">
    <Cell ss:MergeAcross="3" ss:StyleID="TitleStyle"><Data ss:Type="String">${settings.competitionName} - Standings</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="3"><Data ss:Type="String">Event: ${settings.eventName} | Generated: ${new Date().toLocaleString()}</Data></Cell>
   </Row>
   <Row/>
   
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Rank</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Team Name</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Seat</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Score</Data></Cell>
   </Row>`;
   
  sortedTeams.forEach((team, idx) => {
    xml += `
   <Row ss:Height="20">
    <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell><Data ss:Type="String">${team.name}</Data></Cell>
    <Cell><Data ss:Type="String">Seat ${team.seat}</Data></Cell>
    <Cell ss:StyleID="ScoreStyle"><Data ss:Type="Number">${scores[team.id] || 0}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Detailed Logs">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="180"/>
   <Column ss:Width="250"/>
   
   <Row ss:Height="30">
    <Cell ss:MergeAcross="6" ss:StyleID="TitleStyle"><Data ss:Type="String">LCC Match Logs History</Data></Cell>
   </Row>
   <Row/>
   
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Time</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Round</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Question #</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Team</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Score Change</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Reason / Action</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Additional Details</Data></Cell>
   </Row>`;

  history.forEach(item => {
    const timeStr = new Date(item.timestamp).toLocaleTimeString();
    xml += `
   <Row ss:Height="20">
    <Cell><Data ss:Type="String">${timeStr}</Data></Cell>
    <Cell><Data ss:Type="String">${item.round}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.questionNumber}</Data></Cell>
    <Cell><Data ss:Type="String">${item.teamName}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.scoreChange}</Data></Cell>
    <Cell><Data ss:Type="String">${item.reason}</Data></Cell>
    <Cell><Data ss:Type="String">${item.details || ''}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lcc_pro_full_report_${Date.now()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads a high-resolution PNG image of the scoreboard standings
 * rendered on a beautiful custom HTML5 Canvas.
 */
export function exportScoreboardPNG(teams: Team[], scores: Record<number, number>, competitionName: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 630);
  grad.addColorStop(0, '#0F172A'); // Deep dark navy
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 630);

  // Decorative Geometric Islamic / Modern Accents
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(600, 315, 50 + i * 50, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw header text
  ctx.fillStyle = '#D4AF37'; // Gold
  ctx.font = 'bold 36px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(competitionName.toUpperCase(), 600, 70);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 18px "Inter", sans-serif';
  ctx.fillText("LCC PRO SCORING SYSTEM • OFFICIAL STANDINGS", 600, 110);

  // Sort teams
  const sortedTeams = [...teams].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  // Render cards for the 3 teams
  sortedTeams.forEach((team, idx) => {
    const y = 160 + idx * 140;
    
    // Draw Glass Card Background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    
    // Card color
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(100, y, 1000, 110, 16);
    ctx.fill();
    
    // Gold Border for Leader, subtle otherwise
    ctx.shadowBlur = 0; // reset
    ctx.strokeStyle = idx === 0 ? '#D4AF37' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = idx === 0 ? 3 : 1.5;
    ctx.stroke();

    // Rank Number
    ctx.textAlign = 'center';
    ctx.fillStyle = idx === 0 ? '#D4AF37' : '#94A3B8';
    ctx.font = 'bold 44px "Poppins", sans-serif';
    ctx.fillText(`${idx + 1}`, 160, y + 70);

    // Crown or Rank Badge
    if (idx === 0) {
      ctx.font = '28px sans-serif';
      ctx.fillText('👑', 160, y + 30);
    }

    // Team Accent Color Circle
    ctx.fillStyle = team.color;
    ctx.beginPath();
    ctx.arc(260, y + 55, 25, 0, Math.PI * 2);
    ctx.fill();

    // Logo Initial inside circle
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(team.logo || team.name.charAt(0), 260, y + 63);

    // Team Name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 28px "Poppins", sans-serif';
    ctx.fillText(team.name, 310, y + 55);

    // Seat Position
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillText(`Seat ${team.seat}`, 310, y + 80);

    // Team Score (Huge animated-style display)
    ctx.textAlign = 'right';
    ctx.fillStyle = idx === 0 ? '#D4AF37' : '#3B82F6';
    ctx.font = 'bold 44px "JetBrains Mono", monospace';
    ctx.fillText(`${scores[team.id] || 0}`, 1060, y + 70);
  });

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = '14px "Inter", sans-serif';
  ctx.fillText(`Generated automatically via Offline LCC Pro System on ${new Date().toLocaleString()}`, 600, 600);

  // Trigger download
  const image = canvas.toDataURL("image/png");
  const link = document.createElement('a');
  link.href = image;
  link.download = `lcc_scoreboard_standings_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
