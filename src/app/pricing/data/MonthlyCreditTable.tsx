import React from 'react';
import { MONTHLY_CREDITS } from './monthly-credit';

export default function MonthlyCreditTable() {
    return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-0 py-1">
            <h2 className="text-4xl md:text-5xl font-normal text-center mb-10 text-black tracking-tight leading-tight">
                See exactly what you can produce with<br />
                each plan's monthly credits
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm md:text-base">
                    <thead>
                        <tr className="border-b border-transparent">
                            <th className="text-left font-medium py-2 px-4 w-1/3"></th>
                            <th className="text-left font-semibold py-2 px-4 text-gray-900 w-[15%]">Free</th>
                            <th className="text-left font-semibold py-2 px-4 text-gray-900 w-[15%]">Starter</th>
                            <th className="text-left font-semibold py-2 px-4 text-gray-900 w-[15%]">Professional</th>
                            <th className="text-left font-semibold py-2 px-4 text-gray-900 w-[15%]">Team</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MONTHLY_CREDITS.map((item, index) => (
                            <tr key={index} className="group hover:bg-black/5 transition-colors duration-200">
                                <td className="py-1.5 px-4 text-gray-700 font-medium pl-2">{item.modelName}</td>
                                <td className="py-1.5 px-4 text-gray-600 font-normal">{typeof item.free === 'number' ? item.free.toLocaleString() : item.free}</td>
                                <td className="py-1.5 px-4 text-gray-600 font-normal">{item.starter.toLocaleString()}</td>
                                <td className="py-1.5 px-4 text-gray-600 font-normal">{item.professional.toLocaleString()}</td>
                                <td className="py-1.5 px-4 text-gray-600 font-normal">{item.team.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
