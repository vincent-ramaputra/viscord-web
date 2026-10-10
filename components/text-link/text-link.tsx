import Link from "next/link"
import styles from "./styles.module.css"
import { useRouter } from "next/navigation"
export interface TextLinkProps {
    text: string
    href: string
    fontSize?: number
    onClick?: () => void 
}

export default function TextLink({text, href, fontSize=14, onClick}: TextLinkProps) {
    const router = useRouter();
    return (
        <Link href={href} className={styles.text} style={{fontSize: fontSize}}
        onClick={() => {
            if (onClick) onClick();
            router.push(href);
        }}>{text}</Link>
    );
}