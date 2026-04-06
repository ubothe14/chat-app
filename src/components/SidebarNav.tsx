interface SidebarNavProps {
    activeTab: string
    onTabChange: (tab: string) => void
    onLogout?: () => void
    userRole?: string
    verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected'
}

export default function SidebarNav({ activeTab, onTabChange, onLogout, userRole, verificationStatus }: SidebarNavProps) {
    const topIcons = [
        {
            id: 'chats',
            label: 'Chats',
            icon: (active: boolean) => (
                <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? '#0f172a' : '#64748b'}>
                    <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z" />
                </svg>
            ),
            badge: 1,
        },
        {
            id: 'status',
            label: 'Status',
            icon: (active: boolean) => (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={active ? '#0f172a' : '#64748b'} strokeWidth="2">
                    <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
                    <circle cx="12" cy="12" r="3.5" fill={active ? '#0f172a' : '#64748b'} stroke="none" />
                </svg>
            ),
        },
        {
            id: 'channels',
            label: 'Channels',
            icon: (active: boolean) => (
                <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? '#0f172a' : '#64748b'}>
                    <path d="M20 7h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 3.54 10.05 3 9 3 7.34 3 6 4.34 6 6c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V9c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 14H4v-2h16v2zm0-5H4V9h5.08L7 11.83 8.62 13 12 8.76l3.38 4.24L17 11.83 14.92 9H20v5z" />
                </svg>
            ),
            hasGreenDot: true,
        },
        {
            id: 'communities',
            label: 'Communities',
            icon: (active: boolean) => (
                <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? '#0f172a' : '#64748b'}>
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
            ),
        },
        ...(userRole === 'admin' ? [{
            id: 'admin',
            label: 'Admin',
            icon: (active: boolean) => (
                <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? '#0f172a' : '#64748b'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ),
        }] : []),
    ]

    return (
        <div className="w-[68px] bg-[#f8fbff] flex flex-col items-center justify-between py-[10px] flex-shrink-0">
            {/* Top Icons */}
            <div className="flex flex-col items-center w-full">
                {topIcons.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className="relative w-full h-[52px] flex items-center justify-center group"
                        title={item.label}
                    >
                        {/* Active green bar */}
                        {activeTab === item.id && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[26px] bg-[#0f74ff] rounded-r-full" />
                        )}
                        {/* Hover bg */}
                        <span className="w-[42px] h-[42px] rounded-full flex items-center justify-center group-hover:bg-[#dbeafe] transition-colors duration-150">
                            {item.icon(activeTab === item.id)}
                        </span>
                        {/* Badge */}
                        {item.badge && (
                            <span className="absolute top-[6px] right-[9px] min-w-[18px] h-[18px] bg-[#0f74ff] rounded-full flex items-center justify-center text-[11px] font-medium text-[#ffffff] px-[4px]">
                                {item.badge}
                            </span>
                        )}
                        {/* Green dot */}
                        {item.hasGreenDot && (
                            <span className="absolute top-[8px] right-[12px] w-[8px] h-[8px] bg-[#0f74ff] rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Bottom Icons — Settings + Profile + Logout */}
            <div className="flex flex-col items-center w-full gap-0">
                {/* Settings */}
                <button
                    className="w-full h-[52px] flex items-center justify-center group"
                    title="Settings"
                >
                    <span className="w-[42px] h-[42px] rounded-full flex items-center justify-center group-hover:bg-[#dbeafe] transition-colors duration-150">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#64748b">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
                        </svg>
                    </span>
                </button>

                {/* Profile Avatar */}
                <button className="w-full h-[52px] flex items-center justify-center" title="Profile">
                    <div className="w-[32px] h-[32px] rounded-full overflow-hidden">
                        <svg viewBox="0 0 212 212" width="32" height="32">
                            <path fill="#6b7b8d" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z" />
                            <path fill="#cfd4d6" d="M173.561 171.615a62.767 62.767 0 0 0-22.632-22.851c-9.653-5.901-20.347-9.018-31.342-9.135-11.108.117-21.854 3.241-31.545 9.148a62.81 62.81 0 0 0-22.634 22.853 89.488 89.488 0 0 0 54.164 18.257 89.488 89.488 0 0 0 53.989-18.272z" />
                            <path fill="#cfd4d6" d="M106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 30.513-38.089C144.028 65.326 126.914 48 106.002 48S67.975 65.326 67.975 86.674a38.272 38.272 0 0 0 30.513 38.089A39.66 39.66 0 0 0 106.002 125.5z" />
                        </svg>
                        {verificationStatus !== undefined && (
                            <span style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: verificationStatus === 'verified' ? '#16a34a' : '#f59e0b',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 800,
                                border: '2px solid #fff',
                                boxShadow: '0 0 0 1px rgba(15,23,42,0.12)',
                            }}>
                                {verificationStatus === 'verified' ? '✓' : '!'}
                            </span>
                        )}
                    </div>
                </button>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="w-full h-[52px] flex items-center justify-center group"
                    title="Logout"
                >
                    <span className="w-[42px] h-[42px] rounded-full flex items-center justify-center group-hover:bg-[#fee2e2] transition-colors duration-150">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#64748b" className="group-hover:fill-red-600">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                        </svg>
                    </span>
                </button>
            </div>
        </div>
    )
}
