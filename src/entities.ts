export type Transition<State extends string> = {
	duration: number;
	callback?: (v: unknown) => void;
	state?: State;
};

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
				setTransition: (transition: Transition<State>) => void,
			) => void;
		},
	) =>
	(entity: T, delta: number) => {
		const stateCallbacks = callback(entity, delta);
		entity.lt += delta;
		if (entity.transition !== null) {
			entity.nt = entity.lt / entity.transition.duration;
			if (entity.nt >= 1) {
				if (entity.transition.callback) {
					entity.transition.callback(entity);
				} else if (entity.transition.state) {
					changeState(entity, entity.transition.state, null);
				}
			}
		}
		stateCallbacks[entity.state]?.((transition) => {
			entity.transition = transition;
		});
	};

export const schedule = <State extends string, T extends Entity<State>>(
	callback: (v: T) => void,
	entity: T,
	delay: number,
) => {
	entity.transition = {
		duration: entity.lt + delay,
		callback,
	};
};
