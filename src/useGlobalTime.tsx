import { createContext, useContext } from "react";

export const GlobalTimeContext = createContext(0);

export const useGlobalTime = () => {
	return useContext(GlobalTimeContext);
};
