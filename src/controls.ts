import { clearUniverse, isUniverseEmpty, loadObject, manualStep, running, setSpeed, speed, toggleRunning } from "./life";
import { displayPatternInfo, loadPatternByName, loadRandomPattern } from "./patterns";

function $<T extends HTMLElement>(id: string) {
	return document.getElementById(id) as T;
}

export function updateControls() {
	document.querySelector("#play-pause > img")!.setAttribute("src", `icons/${running ? "pause" : "play"}.svg`);
	$("speed").innerText = `${speed}x`;
	$<HTMLButtonElement>("clear").disabled = isUniverseEmpty();
}

export function initializeControls() {
	updateControls();
	if (localStorage.getItem("/life/help-dismissed") !== "true") {
		$("help").style.display = "flex";
		$<HTMLButtonElement>("show-help").disabled = true;
	}
	$("help-dismiss").addEventListener("click", () => {
		if ($<HTMLInputElement>("dismiss-forever").checked) {
			localStorage.setItem("/life/help-dismissed", "true");
		}
		$("help").style.display = "none";
		$<HTMLButtonElement>("show-help").disabled = false;
	});
	$("help-close").addEventListener("click", () => {
		$("help").style.display = "none";
		$<HTMLButtonElement>("show-help").disabled = false;
	});
	$("show-help").addEventListener("click", () => {
		if ($("help").style.display === "flex") {
			$("help").style.display = "none";
		}
		else {
			$("dismiss-forever-container").style.display = "none";
			$("help").style.display = "flex";
			$("info").style.display = "none";
		}
	});
	$("info-dismiss").addEventListener("click", () => {
		$("info").style.display = "none";
	});
	$("info-close").addEventListener("click", () => {
		$("info").style.display = "none";
	});
	$("show-info").addEventListener("click", () => {
		if ($("info").style.display === "flex") {
			$("info").style.display = "none";
		}
		else {
			$("dismiss-forever-container").style.display = "none";
			$("info").style.display = "flex";
			$("help").style.display = "none";
			$<HTMLButtonElement>("show-help").disabled = false;
		}
	});
	$("play-pause").addEventListener("click", () => {
		toggleRunning();
		updateControls();
	});
	$("speed-decrease").addEventListener("click", () => {
		setSpeed(speed / 2);
		updateControls();
	});
	$("speed-increase").addEventListener("click", () => {
		setSpeed(speed * 2);
		updateControls();
	});
	$("step").addEventListener("click", () => {
		manualStep();
		updateControls();
	});
	$("clear").addEventListener("click", () => {
		clearUniverse();
		displayPatternInfo(undefined);
		updateControls();
	});
	$("refresh").addEventListener("click", async () => {
		clearUniverse();
		const pattern = await loadRandomPattern();
		displayPatternInfo(pattern);
		loadObject(-pattern.offsetX - Math.floor(pattern.width / 2), -pattern.offsetY - Math.floor(pattern.height / 2), pattern.data);
		updateControls();
	});
}
