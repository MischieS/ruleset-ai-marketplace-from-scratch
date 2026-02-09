"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/user", label: "User" },
  { href: "/seller", label: "Seller" },
  { href: "/admin", label: "Admin" },
  { href: "/business", label: "Business" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="mainNav" aria-label="Primary">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} className={active ? "navLink active" : "navLink"}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
