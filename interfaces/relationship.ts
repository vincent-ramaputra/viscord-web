import { RelationshipType } from "@/enums/relationship-type.enum"
import { UserProfile } from "./user-profile"

export default interface Relationship {
    id: string
    user: UserProfile
    type: RelationshipType
    createdAt: string
    updatedAt: string
}