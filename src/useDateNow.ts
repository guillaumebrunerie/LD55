import { useState } from "react";
import { useInterval } from "usehooks-ts";

export const useDateNow = (interval: number) => {
	const [dateNow, setDateNow] = useState(Date.now());
	useInterval(() => {
		setDateNow(Date.now());
	}, interval);
	return dateNow;
};
