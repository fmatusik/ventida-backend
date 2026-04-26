import { Category, Listing, ListingImage } from "@prisma/client";
import { ShortListingSummaryDto } from "./dto/short-listing-summary.dto";
import formatTimeAgo from "src/additional/formatAgo.time";

export class ListingMapper{
    static toShortListingSummary(
        listing: Listing & { 
            _count: { views: number, favourites: number } ,
            category: Category,
            images: ListingImage[]
            }
    ): ShortListingSummaryDto {
        return {
            id: listing.id,
            title: listing.title,
            category: listing.category.name,
            price: listing.price,
            viewsCount: listing._count.views,
            likesCount: listing._count.favourites,
            created_at: formatTimeAgo(listing.created_at),
            imageUrl: listing.images && listing.images.length > 0 
                ? (listing.images[0].url.startsWith('http') ? listing.images[0].url : process.env.NEXT_PUBLIC_SERVER_URL + listing.images[0].url) 
                : "",
            location: listing.location
        }
    }
}