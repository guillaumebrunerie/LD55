import { useContext } from "react";
import { GlobalTimeContext } from "./globalTimeContext";

export const useGlobalTime = () => {
	return useContext(GlobalTimeContext);
};
