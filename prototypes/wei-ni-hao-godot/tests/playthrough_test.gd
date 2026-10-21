extends SceneTree
## 自動玩家：用模擬按鍵把三關從頭打到「說出真心話」結局。
##   godot --headless --path . --script res://tests/playthrough_test.gd
## 它會看媽媽的視線和親戚抬頭的時機，該等就等，所以也順便確認每關都過得去。

const MAX_SECONDS_PER_LEVEL := 120.0

var main: Node
var failures: Array = []

# 每關的路線。walk 走到某個 x；up / down 走樓梯；press 按 E。
var routes := {
	1: [["walk", 452], ["up"], ["walk", 1070]],
	2: [["press"], ["walk", 1052], ["down"], ["down"], ["walk", 1090],
		["walk", 1052], ["up"], ["up"], ["walk", 96], ["press"]],
	3: [["walk", 440], ["press"], ["walk", 660], ["press"], ["walk", 792], ["up"], ["walk", 880],
		["walk", 152], ["down"], ["walk", 452], ["down"], ["walk", 580], ["press"]],
}


func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	_run.call_deferred()


func _run() -> void:
	await physics_frame
	main._new_game()
	for i in 3:
		main._show_intro(i)
		main._advance()
		var ok: bool = await _play(i + 1)
		if not ok:
			break
		if i < 2:
			if main.state != "result":
				failures.append("LV.%d 結束後狀態不是過關結算（%s）" % [i + 1, main.state])
				break
	if failures.is_empty():
		if main.state != "ending" or main.last_result.get("ending", "") != "truth":
			failures.append("最後沒有到「說出真心話」結局（state=%s）" % main.state)
	print("被抓包 %d 次，控制 %d，自我 %d，好好談 %d" % [main.caught, main.ctrl, main.selfv, main.talks])
	if failures.is_empty():
		print("PLAYTHROUGH PASSED")
		quit(0)
	else:
		for f in failures:
			printerr("FAIL: ", f)
		quit(1)


func _release_all() -> void:
	for a in ["move_left", "move_right", "up", "down", "interact"]:
		Input.action_release(a)


func _tap(action: String) -> void:
	await physics_frame
	Input.action_press(action)
	await physics_frame
	await physics_frame
	Input.action_release(action)


func _danger_ahead(lv, dir: int) -> bool:
	# 往前走 0.45 秒後的位置，會不會落在亮著（或快亮）的視線、或抬頭的親戚面前？
	var ahead: float = lv.px + dir * 170.0 * 0.45
	var lo := minf(lv.px + dir * 4.0, ahead)
	var hi := maxf(lv.px + dir * 4.0, ahead)
	for z in lv.zones:
		if int(z.floor) != lv.floor_y:
			continue
		if z.type == "patrol":
			var r: Vector2 = lv.zone_range(z)
			if hi >= r.x - 30.0 and lo <= r.y + 30.0:
				return true
			continue
		var rr: Vector2 = lv.zone_range(z)
		if hi < rr.x or lo > rr.y:
			continue
		if lv._cycle_state(z) != "on":
			# 關著的時候，算一下整段走完之前會不會亮起來
			var period: float = z.on + z.off
			var c := fmod(lv.t + z.phase, period)
			var exit_x: float = rr.y if dir > 0 else rr.x
			var need := absf(exit_x - lv.px) / 170.0 + 0.2
			if period - c > need:
				continue
		return true
	for n in lv.npcs:
		if n.type != "relative" or n.satisfied or int(n.floor) != lv.floor_y:
			continue
		if hi >= n.x0 and lo <= n.x1 and (lv.npc_looking(n) or fmod(lv.t + n.phase, n.look + n.busy) > n.look + n.busy - 0.9):
			return true
	return false


func _play(level_id: int) -> bool:
	var lv = main.level
	lv.message.connect(func(text, _kind): print("  [LV.%d t=%.1f x=%d floor=%d] %s" % [level_id, lv.t, lv.px, lv.floor_y, text]))
	var elapsed := 0.0
	var caught_before: int = main.caught
	for step in routes[level_id]:
		match step[0]:
			"walk":
				var target := float(step[1])
				while absf(lv.px - target) > 4.0:
					await physics_frame
					elapsed += 1.0 / 60.0
					if elapsed > MAX_SECONDS_PER_LEVEL:
						failures.append("LV.%d 走到 x=%d 超時（卡在 x=%d, floor=%d）" % [level_id, target, lv.px, lv.floor_y])
						_release_all()
						return false
					if main.state != "play":
						break
					if lv.climbing:
						continue
					var dir := 1 if target > lv.px else -1
					if _danger_ahead(lv, dir):
						_release_all()
						continue
					Input.action_press("move_right" if dir > 0 else "move_left")
					Input.action_release("move_left" if dir > 0 else "move_right")
				_release_all()
			"up", "down":
				var before: int = lv.floor_y
				await _tap(step[0])
				while lv.climbing:
					await physics_frame
				if lv.floor_y == before:
					failures.append("LV.%d 在 x=%d 按 %s 沒有換樓層" % [level_id, lv.px, step[0]])
					return false
			"press":
				await _tap("interact")
				await physics_frame
	# 等過關訊號
	var wait := 0.0
	while main.state == "play" and wait < 2.0:
		await physics_frame
		wait += 1.0 / 60.0
	print("LV.%d 完成：狀態 %s，這關被抓包 %d 次" % [level_id, main.state, main.caught - caught_before])
	return true
