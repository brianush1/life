import { initializeControls, updateControls } from "./controls";
import { clearUniverse, initializeLife, loadObject, render } from "./life";
import { displayPatternInfo, loadPatternByName, loadRandomPattern } from "./patterns";

(async () => {
	initializeLife();
	initializeControls();
	const pattern = await loadPatternByName(location.hash.substring(1));
	displayPatternInfo(pattern);
	loadObject(-pattern.offsetX - Math.floor(pattern.width / 2), -pattern.offsetY - Math.floor(pattern.height / 2), pattern.data);
	updateControls();
	render();
})();

addEventListener("hashchange", async () => {
	clearUniverse();
	const pattern = await loadPatternByName(location.hash.substring(1));
	displayPatternInfo(pattern);
	loadObject(-pattern.offsetX - Math.floor(pattern.width / 2), -pattern.offsetY - Math.floor(pattern.height / 2), pattern.data);
	updateControls();
});

addEventListener("contextmenu", e => {
	e.preventDefault();
});
