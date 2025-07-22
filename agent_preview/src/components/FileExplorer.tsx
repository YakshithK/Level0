"use client";

import React, { useState, useEffect } from "react";

const FileExplorer: React.FC<{ onSelect: (file: string) => void }> = ({ onSelect }) => {
	const [collapsed, setCollapsed] = useState(false);
	const [files, setFiles] = useState<{ name: string; path: string; type: string }[]>([]);

	useEffect(() => {
		fetch("/api/files")
			.then((res) => res.json())
			.then((data) => setFiles(data));
	}, []);

	return (
		<aside className="bg-gray-900 text-white w-64 h-full flex flex-col">
			<button
				className="p-2 text-left bg-gray-800 hover:bg-gray-700"
				onClick={() => setCollapsed(!collapsed)}
			>
				{collapsed ? "▶" : "▼"} Files
			</button>
			{!collapsed && (
				<ul className="p-2">
					{files.map((file) => (
						<li key={file.path}>
							<button
								className="w-full text-left hover:bg-gray-700 p-1 rounded"
								onClick={() => onSelect(file.path)}
							>
								{file.name}
							</button>
						</li>
					))}
				</ul>
			)}
		</aside>
	);
};

export default FileExplorer;
