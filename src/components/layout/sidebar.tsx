"use client";

import React from "react";
import { Listbox, ListboxItem, Tooltip } from "@heroui/react";
import type { ListboxProps, Selection } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { usePathname } from "next/navigation";

export type SidebarItem = {
  key: string;
  title: string;
  icon?: string;
  href?: string;
};

export type SidebarProps = Omit<ListboxProps<SidebarItem>, "children"> & {
  items: SidebarItem[];
  isCompact?: boolean;
  defaultSelectedKey: string;
};

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ items, isCompact, defaultSelectedKey, className, ...props }, ref) => {
    const pathname = usePathname();

    const getSelectedKey = React.useCallback(
      (path: string): string => {
        for (const item of items) {
          if (item.href === "/dashboard" && (path === "/" || path === "/dashboard")) {
            return item.key;
          }
          if (item.href && item.href !== "/dashboard" && path.startsWith(item.href)) {
            return item.key;
          }
        }
        return defaultSelectedKey;
      },
      [items, defaultSelectedKey]
    );

    const [selected, setSelected] = React.useState<React.Key>(() =>
      getSelectedKey(pathname)
    );

    React.useEffect(() => {
      setSelected(getSelectedKey(pathname));
    }, [pathname, getSelectedKey]);

    return (
      <Listbox
        key={isCompact ? "compact" : "default"}
        ref={ref}
        hideSelectedIcon
        as="nav"
        className={cn("list-none", className)}
        color="default"
        itemClasses={{
          base: cn(
            "px-3 min-h-11 rounded-large h-[44px] data-[selected=true]:bg-default-100",
            { "w-11 h-11 gap-0 p-0": isCompact }
          ),
          title: cn(
            "text-small font-medium text-default-500 group-data-[selected=true]:text-foreground"
          ),
        }}
        items={items}
        selectedKeys={[selected] as unknown as Selection}
        selectionMode="single"
        variant="flat"
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0];
          setSelected(key as React.Key);
        }}
        {...props}
      >
        {(item) => (
          <ListboxItem
            key={item.key}
            href={item.href}
            textValue={item.title}
            aria-label={item.title}
            startContent={
              isCompact ? null : item.icon ? (
                <Icon
                  className="text-default-500 group-data-[selected=true]:text-foreground"
                  icon={item.icon}
                  width={24}
                />
              ) : null
            }
            title={isCompact ? null : item.title}
          >
            {isCompact ? (
              <Tooltip content={item.title} placement="right">
                <div className="flex w-full items-center justify-center">
                  {item.icon && (
                    <Icon
                      className="text-default-500 group-data-[selected=true]:text-foreground"
                      icon={item.icon}
                      width={24}
                    />
                  )}
                </div>
              </Tooltip>
            ) : null}
          </ListboxItem>
        )}
      </Listbox>
    );
  }
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
