// 朧 OBORO：フォルダに保存したデータの目録（マップ編集でフォルダに保存すると自動的に書き換わります）
HEX_DATA.files={maps:["hajimari1"],campaigns:[]};
HEX_DATA.files.maps.forEach(f=>document.write('<script src="data/maps/'+f+'.js"><\/script>'));
HEX_DATA.files.campaigns.forEach(f=>document.write('<script src="data/campaigns/'+f+'.js"><\/script>'));
