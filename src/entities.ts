export type Entity<State extends string> = {
	state: State;
	lt: number;
	nt: number;
	transition: Transition<State> | null;
};

export const newEntity = <State extends string>(
	initialState: State,
): Entity<State> => ({
	state: initialState,
	lt: 0,
	nt: 0,
	transition: null,
});

export type Transition<State extends string> = {
	duration: number;
	state: State;
};

export const changeState = <State extends string>(
	entity: Entity<State>,
	state: NoInfer<State>,
	transition: Transition<NoInfer<State>> | null,
) => {
	entity.state = state;
	entity.lt = 0;
	entity.nt = 0;
	entity.transition = transition;
};

export const tick =
	<State extends string, T extends Entity<State>>(
		callback: (
			entity: T,
			delta: number,
		) => {
			[S in State]?: (
				initialCall: boolean,
				setTransition: (transition: Transition<State>) => void,
			) => void;
		},
	) =>
	(entity: T, delta: number) => {
		const stateCallbacks = callback(entity, delta);
		entity.lt += delta;
		let initialCall = false;
		if (entity.transition !== null) {
			entity.nt = entity.lt / entity.transition.duration;
			if (entity.nt >= 1) {
				changeState(entity, entity.transition.state, null);
				initialCall = true;
			}
		}
		stateCallbacks[entity.state]?.(initialCall, (transition) => {
			entity.transition = transition;
		});
	};
