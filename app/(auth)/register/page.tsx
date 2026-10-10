"use client"
import styles from './styles.module.css'
import TextInput from '@/components/text-input/text-input'
import TextLink from '@/components/text-link/text-link'
import ButtonPrimary from "@/components/buttons/button-primary"
import DateInput from "@/components/date-input/date-input"
import Checkbox from "@/components/checkbox/checkbox"
import { FormEvent, useRef, useState } from "react"
import { MIN_AGE_REQUIREMENT, MIN_PASSWORD_LENGTH } from "@/constants/validations"
import { RegisterDTO } from "@/interfaces/dto/register.dto"
import { register } from "@/services/auth/auth.service"
import { ErrorResponse } from "@/interfaces/errors/error-response"
import { Response } from "@/interfaces/response"
import { RegisterError } from "@/interfaces/errors/register-error"
import { useRouter } from "next/navigation"

export default function Register() {
    const containerRef = useRef<HTMLDivElement>(null!);

    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [dob, setDOB] = useState("");
    const [subscribe, setSubscribe] = useState(false);

    const [emailError, setEmailError] = useState<string | null | undefined>(null);
    const [usernameError, setUsernameError] = useState<string | null | undefined>(null);
    const [passwordError, setPasswordError] = useState<string | null | undefined>(null);
    const [dobError, setDOBError] = useState<string | null | undefined>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter()


    function validateEmail() {
        if (!email || email.length === 0) {
            setEmailError("Required");
            return false;
        }
        if (!email.match(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )) {
            setEmailError("Email is not valid");
            return false;
        }

        setEmailError(null);
        return true;
    }


    function validateUsername() {
        if (!username || username.length === 0) {
            setUsernameError("Required");
            return false;
        }

        if (username.match(/[^A-Za-z0-9_.]/)) {
            setUsernameError("Invalid");
            return false;
        }

        setUsernameError(null);
        return true;
    }

    function validatePassword() {
        if (!password || password.length === 0) {
            setPasswordError("Required");
            return false;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            setPasswordError(`Must be at least ${MIN_PASSWORD_LENGTH} characters`);
            return false;
        }

        setPasswordError(null);
        return true;
    }

    function validateDOB() {
        if (!dob || dob.length === 0) {
            setDOBError("Required");
            return false;
        }

        if (new Date().getFullYear() - new Date(dob).getFullYear() < MIN_AGE_REQUIREMENT) {
            setDOBError(`Must be at least ${MIN_AGE_REQUIREMENT} years old`);
            return false;
        }

        setDOBError(null);
        return true;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const emailPassed = validateEmail();
        const usernamePassed = validateUsername();
        const passwordPassed = validatePassword();
        const dobPassed = validateDOB();

        const validationPassed = emailPassed && usernamePassed && passwordPassed && dobPassed;

        if (!validationPassed) {
            return;
        }

        const dto: RegisterDTO = {
            username: username,
            password: password,
            displayName: displayName.length == 0 ? username : displayName,
            email: email,
            dateOfBirth: dob,
            subscribe: subscribe
        };

        setIsSubmitting(true)
        const response: Response<null> = await register(dto);
        setIsSubmitting(false)
        if (!response.success) {
            if (response.message instanceof ErrorResponse) {
                const error = response.message as RegisterError;
                setEmailError(error.email);
                setPasswordError(error.password);
                setUsernameError(error.username);
                setDOBError(error.dateOfBirth);
            }
            return;
        }

        router.push('/channels/me');
        setEmailError(null);
        setPasswordError(null);
        setUsernameError(null);
        setDOBError(null);
    }
    return (
        <div className={styles['content-container'] + " drop-shadow-xl"} ref={containerRef}>
            <div className={styles['register-container']}>
                <div className={styles['title-container']}>
                    <h1 className={"font-semibold text-2xl mb-2"}>Create an account</h1>
                </div>
                <form action="" onSubmit={handleSubmit}>
                    <div className={styles["login-form"]}>
                        <div className="mb-5 pt-1">
                            <TextInput label="Email"
                                isRequired={true}
                                value={email}
                                errorMessage={emailError}
                                onChange={(val) => setEmail(val)} />
                        </div>
                        <div className="mb-5 pt-1">
                            <TextInput label="Display Name"
                                value={displayName}
                                onChange={(val) => setDisplayName(val)}
                                helper="This is how other see you. You can use special characters and emoji." />
                        </div>
                        <div className="mb-5 pt-1">
                            <TextInput label="Username"
                                value={username}
                                onChange={(val) => setUsername(val)}
                                errorMessage={usernameError}
                                isRequired={true}
                                helper="Please only use numbers, letters, underscores _, or periods." />
                        </div>
                        <div className="mb-5 pt-1">
                            <TextInput label="Password"
                                isRequired={true}
                                type="password"
                                value={password}
                                errorMessage={passwordError}
                                onChange={setPassword} />
                        </div>
                        <div className="pt-1 mb-4">
                            <DateInput label="Date of Birth"
                                errorMessage={dobError}
                                isRequired={true}
                                onChange={(date) => setDOB(date.toISOString())} />
                        </div>
                        <div className="mb-5">
                            <Checkbox
                                value={subscribe}
                                onChange={(val) => setSubscribe(val)} >
                                <p className={styles["subscribe-text"]}>(Optional) It&apos;s okay to send me emails with Discord updates, tips, and special offers. You can opt out at any time.</p>
                            </Checkbox>
                        </div>
                        <div className="">
                            <ButtonPrimary isLoading={isSubmitting}>
                                <p>Continue</p>
                            </ButtonPrimary>
                        </div>
                        <div className={styles["tos-text"]}>
                            <p>By registering, you agree to Discord&apos;s <TextLink text="Term of Service" fontSize={12} href="" /> and <TextLink fontSize={12} text="Privacy Policy" href="" /></p>
                        </div>
                        <div className={styles["login-text"]}>
                            <TextLink text="Already have an account?" href="/login"
                                onClick={() =>
                                    containerRef.current.classList.toggle(styles["content-container-disappear"])
                                } />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}