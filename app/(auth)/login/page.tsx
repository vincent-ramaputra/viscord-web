"use client"
import Image from 'next/image'
import styles from './styles.module.css'
import TextInput from '@/components/text-input/text-input'
import TextLink from '@/components/text-link/text-link'
import ButtonPrimary from "@/components/buttons/button-primary"
import { FormEvent, useEffect, useRef, useState } from "react"
import { Response } from "@/interfaces/response"
import { LoginDTO } from "@/interfaces/dto/login.dto"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth.context"
import { useLoginMutation } from "@/hooks/mutations"

export default function Login() {
    const containerRef = useRef<HTMLDivElement>(null!);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const [identifierError, setIdentifierError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const { isAuthorized } = useAuth();

    const {mutateAsync: login, isPending: isSubmitting} = useLoginMutation();

    const router = useRouter();

    useEffect(() => {
        if (isAuthorized) {
            router.push("/channels/me");
        }
    }, [isAuthorized])

    function validateIdentifier(): boolean {
        if (identifier.length == 0) {
            setIdentifierError("Email or username cannot be empty");
            return false;
        }

        setIdentifierError(null);
        return true;
    }

    function validatePassword(): boolean {
        if (password.length == 0) {
            setPasswordError("Password cannot be empty");
            return false;
        }

        setIdentifierError(null);
        return true;
    }



    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const validationPassed = validateIdentifier() && validatePassword();

        if (!validationPassed) {
            return;
        }

        const dto: LoginDTO = { identifier: identifier, password: password };

        const response: Response<null> = await login(dto);

        if (!response.success) {
            setIdentifierError(response.message as string);
            setPasswordError(response.message as string);
            return;
        }

        router.push('/channels/me');
        setIdentifierError(null);
        setPasswordError(null);
    }

    return (
        <div className={styles['content-container'] + " drop-shadow-xl"} ref={containerRef}>
            <div className={styles['login-container']}>
                <div className={styles['title-container']}>
                    <h1 className={"font-semibold text-2xl mb-2"}>Welcome back!!</h1>
                    <p className={styles["second-title"]}>We&apos;re so excited to see you again!</p>
                </div>
                <form action="" onSubmit={handleSubmit}>
                    <div className={styles["login-form"]}>
                        <div className="mb-5 pt-1">
                            <TextInput label="Email or username"
                                isRequired={true}
                                value={identifier}
                                errorMessage={identifierError}
                                onChange={(value) => setIdentifier(value)} />
                        </div>
                        <div className="pt-1">
                            <TextInput
                                label="Password"
                                type="password"
                                isRequired={true}
                                value={password}
                                errorMessage={passwordError}
                                onChange={(value) => setPassword(value)} />
                        </div>
                        <div className="mt-1 mb-5">
                            <TextLink text="Forgot your password?" href="" />
                        </div>
                        <div className="">
                            <ButtonPrimary isLoading={isSubmitting}>
                                <p>Log In</p>
                            </ButtonPrimary>
                        </div>
                        <div className={styles["register-text"]}>
                            <span style={{ color: "var(--header-secondary)" }}>Need an account?{" "}</span>
                            <TextLink text="Register" href="/register"
                                onClick={() =>
                                    containerRef.current.classList.toggle(styles["content-container-disappear"])
                                } />
                        </div>
                    </div>
                </form>
            </div>
            <div className={styles["vertical-separator"]}>
            </div>
            <div className={styles["quick-login-container"]}>
                <div className={styles["qr-code-card"]}>
                    <div className={styles["qr-code"]}>
                    </div>
                    <div className={styles["qr-icon-container"]}>
                        <Image src="/qr-icon.png" alt="" width={50} height={50} />
                    </div>
                </div>
                <h1 className="text-2xl font-semibold mb-2">Log in with QR Code</h1>
                <div className={styles["qr-info-text"]}>
                    <p>Scan this with the <span className="font-bold">Discord mobile app </span>to log in instantly.</p>
                </div>
                <div className="px-4 py-4">
                    <TextLink text="Or, sign in with passkey" href="" />
                </div>
            </div>
        </div>
    );
}
