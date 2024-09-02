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
) => {
	entity.state = state;
	entity.lt = 0;
	entity.nt = 0;
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
	<
		State extends string,
		T extends Entity<State>,
		Args extends unknown[] = [],
	>(
		callback: (
			entity: T,
			delta: number,
			...args: Args
		) => {
			[S in NoInfer<State>]?: () => void;
		} = () => ({}),
	) =>
	(entity: T, delta: number, ...args: Args) => {
		const stateCallbacks = callback(entity, delta, ...args);
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

export const makeTick2 =
	<T extends Entity<any>>(
		callback: (entity: T, delta: number) => void = () => {},
	) =>
	(entity: T, delta: number) => {
		callback(entity, delta);
		entity.lt += delta;
		entity.nt = 0;
		if (entity.transitions[0]) {
			entity.nt = entity.lt / entity.transitions[0].duration;
		}
		const transitionsToRemove: Transition[] = [];
		for (const transition of entity.transitions) {
			if (entity.lt > transition.duration) {
				transition.callback(entity);
				transitionsToRemove.push(transition);
			}
		}
		if (transitionsToRemove.length > 0) {
			entity.transitions = entity.transitions.filter(
				(t) => !transitionsToRemove.includes(t),
			);
		}
	};

export const schedule = <E extends Entity<string>>(
	entity: E,
	duration: number,
	callback: (entity: E) => void,
) => {
	entity.transitions.push({
		duration: entity.lt + duration,
		callback,
	});
};

export const scheduleP = (
	entity: Entity<string>,
	duration: number,
): Promise<void> =>
	new Promise((resolve) => {
		entity.transitions.push({
			duration: entity.lt + duration,
			callback: () => {
				resolve();
			},
		});
	});

export const areIdle = (...entities: Entity<string>[]) => {
	return entities.every((entity) => entity.transitions.length == 0);
};

export const waitUntilIdle = async (entity: Entity<string>) => {
	await scheduleP(entity, 0);
};

export const waitUntilFullLoop = async (
	entity: Entity<string>,
	loopDuration: number,
) => {
	const t = Math.ceil(entity.lt / loopDuration) * loopDuration - entity.lt;
	await scheduleP(entity, t);
};

export const doTransition = <E extends Entity<string>>(
	entity: E,
	state: E["state"],
	duration: number,
): Promise<void> => {
	return new Promise((resolve) => {
		entity.state = state;
		entity.lt = 0;
		entity.nt = 0;
		entity.transitions = [
			{
				duration,
				callback: () => {
					resolve();
				},
			},
		];
	});
};

export const clearTransitions = (entity: Entity<string>) => {
	entity.transitions = [];
};
