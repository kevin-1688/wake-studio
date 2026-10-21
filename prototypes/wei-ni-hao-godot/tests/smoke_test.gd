extends SceneTree
## 關卡資料的自動檢查：
##   godot --headless --path . --script res://tests/smoke_test.gd
## 檢查每關的地板、樓梯、物件都在走得到的位置，而且從起點走得到目標。

const LevelScript := preload("res://scripts/level.gd")

var errors: Array = []


class FakeGame:
	extends Node
	var ctrl := 40
	var selfv := 0
	var talks := 0
	var caught := 0


func _init() -> void:
	var game := FakeGame.new()
	root.add_child(game)
	for d in LevelData.all():
		var lv = LevelScript.new()
		root.add_child(lv)
		lv.setup(d, game, ThemeDB.fallback_font)
		_check_level(lv, d)
		lv.queue_free()
	if errors.is_empty():
		print("SMOKE TEST PASSED")
		quit(0)
	else:
		for e in errors:
			printerr("FAIL: ", e)
		quit(1)


func _err(d: Dictionary, msg: String) -> void:
	errors.append("LV.%d %s" % [d.id, msg])


func _on_floor(lv, x: float, fy: int) -> bool:
	var sp: Vector2 = lv.span_for(x, fy)
	return sp.y > sp.x


# 走得到的地板段：以 (地板, 段的起點) 當節點，樓梯當邊。
func _node(lv, x: float, fy: int) -> String:
	var sp: Vector2 = lv.span_for(x, fy)
	return "%d:%d" % [fy, int(sp.x)]


func _reachable(lv, from_x: float, from_floor: int) -> Dictionary:
	var seen := {_node(lv, from_x, from_floor): true}
	var queue: Array = [[from_x, from_floor]]
	while queue.size() > 0:
		var cur: Array = queue.pop_front()
		var sp: Vector2 = lv.span_for(cur[0], cur[1])
		for s in lv.stairs:
			if s.x < sp.x or s.x > sp.y:
				continue
			var one_way: String = s.get("one_way", "")
			var nxt := -1
			if cur[1] == int(s.bottom) and one_way != "down":
				nxt = int(s.top)
			elif cur[1] == int(s.top) and one_way != "up":
				nxt = int(s.bottom)
			if nxt < 0:
				continue
			var key := _node(lv, s.x, nxt)
			if not seen.has(key):
				seen[key] = true
				queue.append([float(s.x), nxt])
	return seen


func _check_level(lv, d: Dictionary) -> void:
	var start_floor := int(d.start.y)
	if not _on_floor(lv, d.start.x, start_floor):
		_err(d, "起點不在地板上")
	for s in d.stairs:
		if not _on_floor(lv, s.x, int(s.top)) or not _on_floor(lv, s.x, int(s.bottom)):
			_err(d, "樓梯 x=%d 兩端沒有接到地板" % s.x)
	for h in d.hides:
		if not _on_floor(lv, h.x, int(h.floor)):
			_err(d, "躲藏點「%s」不在地板上" % h.label)
		for s in d.stairs:
			if absf(s.x - h.x) < h.w * 0.5 + 8.0 + 22.0 and (int(s.top) == int(h.floor)):
				_err(d, "躲藏點「%s」離往下的樓梯太近，按 ↓ 會變成下樓" % h.label)
	for p in d.pickups:
		if not _on_floor(lv, p.x, int(p.floor)):
			_err(d, "物件「%s」不在地板上" % p.label)
	for n in d.npcs:
		if not _on_floor(lv, n.x, int(n.floor)):
			_err(d, "角色 %s 不在地板上" % n.get("label", n.type))
	var poa := false
	for r in d.rooms:
		poa = poa or r.get("poa", false)
	if not poa:
		_err(d, "沒有優勢點房間")

	var from_start := _reachable(lv, d.start.x, start_floor)
	var targets: Array = []
	for p in d.pickups:
		targets.append([p.x, int(p.floor), p.label])
	for n in d.npcs:
		if n.type == "boss":
			targets.append([n.x, int(n.floor), "餐桌"])
	for tg in targets:
		if not from_start.has(_node(lv, tg[0], tg[1])):
			_err(d, "從起點走不到「%s」" % tg[2])
	# 第 2 關：拿到畫之後要走得回書桌
	if d.has("desk"):
		for p in d.pickups:
			if p.id == "painting":
				var back := _reachable(lv, p.x, int(p.floor))
				if not back.has(_node(lv, d.desk.x, int(d.desk.floor))):
					_err(d, "拿到畫之後走不回書桌")
	# 第 3 關：拿到素描本之後要走得到餐桌
	for p in d.pickups:
		if p.id == "sketch":
			var after := _reachable(lv, p.x, int(p.floor))
			for n in d.npcs:
				if n.type == "boss" and not after.has(_node(lv, n.x, int(n.floor))):
					_err(d, "拿到素描本之後走不到餐桌")
	print("LV.%d checked: %d rooms, %d stairs, reachable segments %d" % [d.id, d.rooms.size(), d.stairs.size(), from_start.size()])
