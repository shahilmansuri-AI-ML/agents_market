import { Button } from "@/components/ui/button";
import { BookCopy, ChevronLeft, Code2, IdCard, PlayIcon } from "lucide-react";
import Link from "next/link";

type HeaderProps = {
  agentName: string;
  agentId: string;
};

const Header = ({ agentName, agentId }: HeaderProps) => {
  return (
    <div
      className="
        flex items-center justify-between w-full p-3

        bg-white dark:bg-[#0f1115]

        border-b
        border-slate-200 dark:border-[#1f2937]

        transition-colors duration-200
      "
    >
      {/* Left Section */}
      <Link
        href="/dashboard"
        className="inline-flex flex-col group cursor-pointer"
      >
        {/* Top Row */}
        <div className="flex items-center gap-1">
          <ChevronLeft
            className="
        h-6 w-6
        text-slate-600 dark:text-slate-400
        group-hover:text-black dark:group-hover:text-white
        transition-colors
      "
          />

          <h2
            className="
        text-lg font-semibold leading-none
        text-slate-800 dark:text-white
        transition-colors
      "
          >
            {agentName || "Loading..."}
          </h2>
        </div>

        {/* Smaller Agent ID */}
        <div
          className="
      flex items-center gap-1
      ml-2
      mt-[2.5px]

      text-[8px]
      text-slate-400 dark:text-slate-500

      font-mono
      tracking-tight

      transition-colors
    "
        >
          <BookCopy className="h-3 w-3 flex-shrink-0 opacity-70" />
          <span className="truncate max-w-[150px] opacity-80">
            {agentId || "Loading..."}
          </span>
        </div>
      </Link>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="
            text-slate-700
            dark:text-slate-300

            hover:bg-slate-100
            dark:hover:bg-[#111827]
          "
        >
          <Code2 className="mr-1 h-4 w-4" />
          Code
        </Button>

        <Button
          className="
            bg-blue-600 hover:bg-blue-700

            dark:bg-blue-500
            dark:hover:bg-blue-600

            text-white
          "
        >
          <PlayIcon className="mr-1 h-4 w-4" />
          Preview
        </Button>

        <Button
          className="
            bg-emerald-600 hover:bg-emerald-700

            dark:bg-emerald-500
            dark:hover:bg-emerald-600

            text-white
          "
        >
          Publish
        </Button>
      </div>
    </div>
  );
};

export default Header;
