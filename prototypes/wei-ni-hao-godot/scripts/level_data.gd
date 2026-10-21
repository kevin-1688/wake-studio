class_name LevelData
extends RefCounted
## 三關的資料。座標直接沿用簡報裡的關卡地圖（地圖區 1184 × 592）。
## 房間的底邊就是地板；走道把同一層的房間接起來；樓梯把上下兩層接起來。
##
## 房間 kind：main 主線、opt 可選／祕密、danger 會被看到、boss 王房
## 視線 zones：
##   cycle  — 一閃一閃的視線（門縫、窗戶）。有 origin/dir 時，長度會隨「控制」變長。
##   patrol — 會來回走動的媽媽，視線在她面前。


static func all() -> Array:
	return [level_1(), level_2(), level_3()]


static func level_1() -> Dictionary:
	return {
		"id": 1,
		"title": "LV.1　7 歲・才藝班",
		"say": "隔壁志明三歲就開始學鋼琴了。",
		"goal": "從玄關走回二樓自己的房間，拿到蠟筆盒。",
		"tip": "紅色是媽媽從廚房門縫看出來的視線，會一閃一閃。等它暗下來再走到樓梯，或先躲到沙發後面。④ 樓梯轉角是優勢點，站上去看得到整層樓。",
		"player_scale": 0.8,
		"caught_ctrl": 10,
		"start": Vector2(100, 474),
		"rooms": [
			{"id": "r7", "name": "⑦ 爸媽房間", "sub": "可選：舊蠟筆", "rect": Rect2(42, 144, 220, 110), "kind": "opt"},
			{"id": "r4", "name": "④ 樓梯轉角", "sub": "優勢點", "rect": Rect2(322, 144, 260, 110), "kind": "main", "poa": true},
			{"id": "r5", "name": "⑤ 走廊", "sub": "撿蠟筆", "rect": Rect2(642, 144, 240, 110), "kind": "main"},
			{"id": "r6", "name": "⑥ 我的房間", "sub": "終點：蠟筆盒", "rect": Rect2(922, 144, 240, 110), "kind": "main"},
			{"id": "r1", "name": "① 玄關", "sub": "放學回家", "rect": Rect2(42, 364, 220, 110), "kind": "main"},
			{"id": "r2", "name": "② 客廳", "sub": "鋼琴在這", "rect": Rect2(322, 364, 260, 110), "kind": "main"},
			{"id": "r3", "name": "③ 廚房", "sub": "媽媽在這", "rect": Rect2(642, 364, 240, 110), "kind": "danger"},
		],
		"corridors": [[262, 322, 474], [582, 642, 474], [262, 322, 254], [582, 642, 254], [882, 922, 254]],
		"stairs": [{"x": 452, "top": 254, "bottom": 474}],
		"hides": [
			{"x": 368, "floor": 474, "w": 44, "label": "鋼琴"},
			{"x": 540, "floor": 474, "w": 50, "label": "沙發"},
		],
		"pickups": [
			{"id": "crayon", "x": 730, "floor": 254, "label": "蠟筆", "self": 1, "msg": "撿到一支蠟筆。（自我 +1）"},
			{"id": "old_crayon", "x": 120, "floor": 254, "label": "舊蠟筆", "self": 1, "msg": "爸媽房間的衣櫃裡，藏著一支很舊的蠟筆。（自我 +1）"},
			{"id": "box", "x": 1070, "floor": 254, "label": "蠟筆盒", "self": 2, "clear": true, "msg": "拿到蠟筆盒！"},
		],
		"zones": [
			{"type": "cycle", "floor": 474, "origin": 642, "dir": -1, "base": 160.0, "per": 1.0,
				"on": 2.2, "off": 2.2, "warn": 0.8, "phase": 0.0,
				"line": "又在家裡亂跑？鋼琴練了沒！"},
			{"type": "cycle", "floor": 474, "x0": 642, "x1": 882, "on": 1.0, "off": 0.0, "warn": 0.0, "phase": 0.0,
				"line": "（你走進廚房。）功課寫完了嗎？鋼琴練了沒？"},
		],
		"npcs": [{"type": "mom", "x": 790, "floor": 474}],
		"clear_text": "你在房間裡打開蠟筆盒。那天晚上，你畫了一架會飛的鋼琴。",
	}


static func level_2() -> Dictionary:
	return {
		"id": 2,
		"title": "LV.2　15 歲・會考",
		"say": "剩一百天，現在不拼什麼時候拼？",
		"goal": "先在書桌按 E 假裝讀書，再溜去巷口畫室拿回你的畫，趕在媽媽巡房前回到書桌按 E。",
		"tip": "沒假裝讀書就離開房門口，監視器會拍到。上路翻陽台比較遠，鄰居阿姨會從窗戶看；下路穿過客廳比較近，但媽媽在巡。",
		"player_scale": 0.95,
		"caught_ctrl": 12,
		"start": Vector2(96, 174),
		"desk": {"x": 96, "floor": 174},
		"timer": 80.0,
		"camera_line": "監視器我都有看。你以為我不知道？",
		"timer_line": "（媽媽推開房門。）人呢？補習班老師打電話來說你今天也沒去！",
		"rooms": [
			{"id": "a", "name": "① 房門口", "sub": "起點・優勢點", "rect": Rect2(42, 64, 220, 330), "kind": "main", "poa": true, "floors": [174, 394]},
			{"id": "b", "name": "② 頂樓陽台", "sub": "安全但繞遠", "rect": Rect2(322, 64, 280, 110), "kind": "main"},
			{"id": "c", "name": "③ 鄰居屋頂", "sub": "阿姨會看到", "rect": Rect2(662, 64, 240, 110), "kind": "danger"},
			{"id": "d", "name": "④ 客廳", "sub": "近，但媽媽在巡房", "rect": Rect2(322, 284, 580, 110), "kind": "danger"},
			{"id": "e", "name": "⑤ 後門", "sub": "兩條路在這會合", "rect": Rect2(942, 64, 220, 330), "kind": "main", "floors": [174, 394]},
			{"id": "g", "name": "⑥ 地下儲藏室", "sub": "祕密：藏作品", "rect": Rect2(322, 464, 280, 100), "kind": "opt"},
			{"id": "h", "name": "⑦ 巷口畫室", "sub": "終點：一張畫", "rect": Rect2(942, 464, 220, 100), "kind": "main"},
		],
		"corridors": [[262, 322, 174], [602, 662, 174], [902, 942, 174], [262, 322, 394], [902, 942, 394]],
		"stairs": [
			{"x": 152, "top": 174, "bottom": 394},
			{"x": 1052, "top": 174, "bottom": 394},
			{"x": 462, "top": 394, "bottom": 564},
			{"x": 1052, "top": 394, "bottom": 564},
		],
		"hides": [
			{"x": 760, "floor": 174, "w": 44, "label": "水塔"},
			{"x": 560, "floor": 394, "w": 54, "label": "沙發"},
			{"x": 800, "floor": 394, "w": 40, "label": "窗簾"},
		],
		"pickups": [
			{"id": "painting", "x": 1090, "floor": 564, "label": "一張畫", "self": 2,
				"msg": "畫室老師把你上週的畫還給你：「你很有天分，不要放棄。」（自我 +2）快回書桌！"},
			{"id": "stash", "x": 380, "floor": 564, "label": "作品集", "self": 2,
				"msg": "地下儲藏室的箱子裡，藏著你國中以來所有的畫。（自我 +2）"},
		],
		"zones": [
			{"type": "cycle", "floor": 174, "x0": 662, "x1": 902, "on": 1.8, "off": 3.0, "warn": 0.8, "phase": 1.0,
				"line": "阿姨：欸，你們家那個是不是在屋頂上？（她馬上傳到家族群組。）"},
			{"type": "patrol", "floor": 394, "x0": 360, "x1": 880, "speed": 75.0, "base": 130.0, "per": 0.8, "pause": 1.2,
				"line": "這麼晚了你要去哪裡？給我回房間讀書！"},
		],
		"npcs": [{"type": "watcher", "x": 872, "floor": 174, "label": "阿姨"}],
		"clear_text": "你坐回書桌的那一秒，門開了。媽媽看了一眼：「嗯。」她沒發現。",
	}


static func level_3() -> Dictionary:
	return {
		"id": 3,
		"title": "LV.3　30 歲・除夕",
		"say": "王阿姨家的孩子人很好，初二見個面而已。",
		"goal": "上閣樓找到媽媽的素描本，跟親戚好好談過兩次，再到圍爐餐桌按 E 跟媽媽說真心話。",
		"tip": "親戚抬頭時經過會被追問（電量 −25）；走到他們旁邊按 E 好好談（電量 −15），他們就會放你過去。⑥ 後樓梯是單向捷徑，⑤ 二樓走廊是優勢點。",
		"player_scale": 1.05,
		"caught_ctrl": 0,
		"energy": 100,
		"start": Vector2(100, 394),
		"rooms": [
			{"id": "f", "name": "⑥ 後樓梯", "sub": "捷徑回玄關", "rect": Rect2(42, 64, 220, 110), "kind": "opt"},
			{"id": "e", "name": "⑤ 二樓走廊", "sub": "優勢點：看得到餐桌", "rect": Rect2(322, 64, 260, 110), "kind": "main", "poa": true},
			{"id": "d", "name": "④ 閣樓", "sub": "媽媽的舊箱子", "rect": Rect2(642, 64, 300, 110), "kind": "main"},
			{"id": "a", "name": "① 玄關", "sub": "回老家過年", "rect": Rect2(42, 284, 220, 110), "kind": "main"},
			{"id": "b", "name": "② 客廳", "sub": "阿姨問薪水", "rect": Rect2(322, 284, 260, 110), "kind": "danger"},
			{"id": "c", "name": "③ 樓梯口", "sub": "舅舅問對象", "rect": Rect2(642, 284, 300, 110), "kind": "danger"},
			{"id": "g", "name": "⑦ 圍爐餐桌", "sub": "Boss：說出真心話", "rect": Rect2(322, 464, 620, 110), "kind": "boss"},
		],
		"corridors": [[262, 322, 394], [582, 642, 394], [262, 322, 174], [582, 642, 174]],
		"stairs": [
			{"x": 792, "top": 174, "bottom": 394},
			{"x": 152, "top": 174, "bottom": 394, "one_way": "down"},
			{"x": 452, "top": 394, "bottom": 574},
		],
		"hides": [{"x": 548, "floor": 394, "w": 44, "label": "紙箱"}],
		"pickups": [
			{"id": "sketch", "x": 880, "floor": 174, "label": "素描本", "self": 0,
				"msg": "閣樓的箱子裡，有一本褪色的素描本。封面寫著媽媽的名字。"},
		],
		"zones": [],
		"npcs": [
			{"type": "relative", "id": "aunt", "label": "阿姨", "x": 516, "floor": 394, "x0": 472, "x1": 604,
				"look": 2.0, "busy": 2.6, "phase": 0.0,
				"line_caught": "阿姨：一個月領多少啊？志明已經在存第二間房的頭期款了。",
				"line_talk": "你跟阿姨講了自己在做的設計案。她聽完說：「喔……那也不錯啦。」（好好談 +1）"},
			{"type": "relative", "id": "uncle", "label": "舅舅", "x": 722, "floor": 394, "x0": 676, "x1": 770,
				"look": 2.2, "busy": 2.4, "phase": 1.3,
				"line_caught": "舅舅：三十了還沒對象？你媽很擔心欸。",
				"line_talk": "你跟舅舅說，現在一個人也過得很好。他沉默了一下，拍拍你的肩膀。（好好談 +1）"},
			{"type": "boss", "x": 640, "floor": 574, "label": "媽媽"},
		],
		"need_line": "你拿著素描本，話到了嘴邊又吞回去。你們之間還沒有能說真心話的路（好好談過 %d／2 次）。先去跟親戚好好談一談。",
		"confirm_line": "你還沒拿到素描本。要直接坐下說「我很好」嗎？3 秒內再按一次 E。",
	}
