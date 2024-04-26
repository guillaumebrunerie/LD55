export type Transition = {
	duration: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callback: (v: any) => void;
};

export type Entity<State extends string> = {
	state: State;
	lt: number;
	nt: number;
	transitions: Transition[];
};

export const newEntity = <State extends string>(
	initialState: State,
	transitions: Transition[] = [],
): Entity<State> => ({
	state: initialState,
	lt: 0,
	nt: 0,
	transitions,
});

export const idleState = <State extends string>(
	entity: Entity<State>,
	state: NoInfer<State>,
	transitions: Transition[] = [],
) => {
	entity.state = state;
	entity.lt = 0;
	entity.nt = 0;
	entity.transitions = transitions;
};

export const changeState = <E extends Entity<string>>(
	entity: E,
	state: E["state"],
	duration: number,
	callback: (entity: E) => void,
) => {
	entity.state = state;
	entity.lt = 0;
	entity.nt = 0;
	entity.transitions = [{ duration, callback }];
};

export const makeTick =
	<State extends string, T extends Entity<State>>(
		callback: (
			entity: T,
			delta: number,
		) => {
			[S in NoInfer<State>]?: () => void;
		} = () => ({}),
	) =>
	(entity: T, delta: number) => {
		const stateCallbacks = callback(entity, delta);
		entity.lt += delta;
		if (entity.transitions.length > 0) {
			entity.nt = entity.lt / entity.transitions[0].duration;
			if (entity.nt >= 1) {
				const callback = entity.transitions[0].callback;
				entity.transitions = entity.transitions.slice(1);
				entity.lt = 0;
				entity.nt = 0;
				callback(entity);
			}
		}
		stateCallbacks[entity.state]?.();
	};

export const schedule = <State extends string, T extends Entity<State>>(
	callback: (v: T) => void,
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
