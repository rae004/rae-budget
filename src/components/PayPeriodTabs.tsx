import React, { useContext, useEffect, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import PayPeriod from '@/components/PayPeriod';
import { GlobalContext } from '@/lib/hooks/globalContext';

const PayPeriodTabs = ({ ...props }) => {
    const [state, dispatch] = useContext(GlobalContext);

    const addTab = () => {
        const tabIndex = state.payPeriods.length + 1;
        const newPayPeriodTabProps = {
            tabTitle: `Pay Period: ${tabIndex}`,
            tabDescription: `This is content for tab ${tabIndex}`,
            payPeriodProps: {
                tabIndex,
                additionalSpendingTotal: 0,
                additionalSpendingItems: [],
                monthlyBillsTotal: 0,
                monthlyBillsItems: [],
                totalsOverview: {
                    monthlySpending: 0,
                    runningTotal: 0,
                    additionalIncome: 0,
                    payCheck: 0,
                    remainingPayPeriodAmount: 0,
                },
            },
        };

        dispatch({
            type: 'ADD_PAY_PERIOD',
            payload: newPayPeriodTabProps,
        });
    };

    return (
        <div className="card">
            <Button
                label="Add Tab"
                onClick={addTab}
                icon="pi pi-check"
                size="small"
            />
            <TabView scrollable>
                {state.payPeriods.map(
                    (tab: any, index: number) => {
                        const { payPeriodProps } = tab;
                        return (
                            <TabPanel
                                key={index}
                                header={tab.tabTitle}
                            >
                                <p className="m-0">
                                    {tab.tabDescription}
                                </p>

                                <PayPeriod
                                    {...payPeriodProps}
                                />
                            </TabPanel>
                        );
                    },
                )}
            </TabView>
        </div>
    );
};

export default PayPeriodTabs;
