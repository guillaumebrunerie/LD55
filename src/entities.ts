export type Entity<State extends string = string> = {
	state: State;
	gt: number; // Never reset
	lt: number; // Reset at each state change
	nt: number; // lt / duration
	duration: number | null;
	nextState: State;
	callbacks: Callback[];
	delayedCallbacks: DelayedCallback[];
};

export type Callback = (entity: any) => void;

export type DelayedCallback = {
	lt: number;
	callback: Callback;
};

export const newEntity = <State extends string>(
	initialState: State,
): Entity<State> => ({
	state: initialState,
	gt: 0,
	lt: 0,
	nt: 0,
	duration: null,
	nextState: initialState,
	callbacks: [],
	delayedCallbacks: [],
});

export const idleState = <State extends string>(
	entity: Entity<State>,
	state: NoInfer<State>,
) => {
	entity.state = state;
	entity.lt = 0;
	entity.nt = 0;
	entity.duration = null;
	entity.nextState = state;
	entity.callbacks = [];
	entity.delayedCallbacks = [];
};

export const clear = <State extends string>(entity: Entity<State>) => {
	entity.delayedCallbacks = [];
};

export const makeTick =
	<T extends Entity>(
		callback: (entity: T, delta: number) => void = () => {},
	) =>
	(entity: T, delta: number) => {
		callback(entity, delta);
		entity.gt += delta;
		entity.lt += delta;
		entity.nt = entity.lt / (entity.duration ?? Infinity);
		if (entity.nt > 1) {
			const cbs = entity.callbacks;
			idleState(entity, entity.nextState);
			for (const cb of cbs) {
				cb(entity);
			}
		}
		if (entity.duration === null) {
			let didTriggerCallback = false;
			for (const delayedCallback of entity.delayedCallbacks) {
				if (delayedCallback.lt < entity.lt) {
					delayedCallback.callback(entity);
					didTriggerCallback = true;
				}
			}
			if (didTriggerCallback) {
				entity.delayedCallbacks = entity.delayedCallbacks.filter(
					(delayerCallback) => delayerCallback.lt >= entity.lt,
				);
			}
		}
	};

export const doTransition = <E extends Entity>(
	entity: E,
	duration: number,
	transitionState: E["state"],
	nextState: E["state"],
	nt = 0,
): Promise<void> => {
	return new Promise((resolve) => {
		entity.state = transitionState;
		entity.lt = nt * duration;
		entity.nt = nt;
		entity.duration = duration;
		entity.nextState = nextState;
		entity.callbacks.push(resolve);
		entity.delayedCallbacks = [];
	});
};

/*

The wizard has:
- appear: needs to be hidden
- die: needs to be idle
- disappearFromIdle: needs to be idle
- disappear: could be whatever state, will first go backToIdle
- backToIdle: could be magic, waiting, win
- magicStart: needs to be idle
- waitingStart: needs to be idle
- win: needs to be idle

Building blocks:
- check current state
- play animation

 */

export const scheduleX = <E extends Entity>(
	entity: E,
	lt: number,
	callback: (entity: E) => void,
) => {
	entity.delayedCallbacks.push({
		lt: entity.lt + lt,
		callback,
	});
};

export const scheduleP = (entity: Entity, lt: number): Promise<void> =>
	new Promise((resolve) => {
		entity.delayedCallbacks.push({
			lt,
			callback: () => {
				resolve();
			},
		});
	});

export const schedule0 = (entity: Entity): Promise<void> =>
	new Promise((resolve) => {
		entity.callbacks.push(resolve);
	});

// export const areIdle = (...entities: Entity<string>[]) => {
// 	return entities.every((entity) => entity.transitions.length == 0);
// };

export const waitUntilIdle = async (entity: Entity) => {
	await schedule0(entity);
};

export const waitUntilFullLoop = async (
	entity: Entity,
	loopDuration: number,
) => {
	const t = Math.ceil(entity.lt / loopDuration) * loopDuration;
	await scheduleP(entity, t);
};

// export const doTransition = <E extends Entity<string>>(
// 	entity: E,
// 	state: E["state"],
// 	duration: number,
// ): Promise<void> => {
// 	return new Promise((resolve) => {
// 		entity.state = state;
// 		entity.lt = 0;
// 		entity.nt = 0;
// 		entity.transitions = [
// 			{
// 				duration,
// 				callback: () => {
// 					resolve();
// 				},
// 			},
// 		];
// 	});
// };

// export const clearTransitions = <E extends Entity<string>>(entity: E) => {
// 	entity.transitions = [];
// };

export const areIdle2 = (...entities: Entity[]) => {
	return entities.every((entity) => entity.duration === null);
};
