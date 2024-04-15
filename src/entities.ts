export type Transition<State extends string> = {
	duration: number;
	callback?: (v: unknown) => void;
	state?: State;
};

export type Entity<State extends string> = {
	state: State;
	lt: number;
	nt: number;
	transitions: Transition<State>[];
};

export const newEntity = <State extends string>(
	initialState: State,
	transitions: Transition<State>[] = [],
): Entity<State> => ({
	state: initialState,
	lt: 0,
	nt: 0,
	transitions,
});

export const changeState = <State extends string>(
	entity: Entity<State>,
	state: NoInfer<State>,
	transitions: Transition<NoInfer<State>>[] = [],
) => {
	entity.state = state;
	entity.lt = 0;
	entity.nt = 0;
	entity.transitions = transitions;
};

export const tick =
	<State extends string, T extends Entity<State>>(
		callback: (
			entity: T,
			delta: number,
		) => {
			[S in State]?: () => void;
		},
	) =>
	(entity: T, delta: number) => {
		const stateCallbacks = callback(entity, delta);
		entity.lt += delta;
		if (entity.transitions.length > 0) {
			entity.nt = entity.lt / entity.transitions[0].duration;
			if (entity.nt >= 1) {
				if (entity.transitions[0].callback) {
					const callback = entity.transitions[0].callback;
					entity.transitions = entity.transitions.slice(1);
					entity.lt = 0;
					entity.nt = 0;
					callback(entity);
				} else if (entity.transitions[0].state) {
					changeState(
						entity,
						entity.transitions[0].state,
						entity.transitions.slice(1),
					);
				}
			}
		}
		stateCallbacks[entity.state]?.();
	};

export const schedule = <State extends string, T extends Entity<State>>(
	callback: (v: any) => void,
	entity: T,
	delay: number,
) => {
	entity.transitions.push({
		duration: entity.lt + delay,
		callback,
	});
};

export const areIdle = (...entities: Entity<string>[]) => {
	return entities.every((entity) => entity.transitions.length == 0);
};
