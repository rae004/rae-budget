import { createContext } from 'react';

export type GlobalState = {
    totalAdditionalSpending: number;
};

export type GlobalProps = {
    setGlobalState: (state: GlobalState) => void;
} & GlobalState;

export const GlobalContext = createContext<GlobalProps>({
    totalAdditionalSpending: 0,
    setGlobalState: () => {},
});
