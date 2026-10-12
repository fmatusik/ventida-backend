import { Category, ListingImage } from '@prisma/client';
import { ShortListingSummaryDto } from './dto/short-listing-summary.dto';
import formatTimeAgo from '../../additional/formatAgo.time';

type MappableListing = {
  id: number;
  title: string;
  price: number;
  location: string;
  created_at: Date;
  category: Pick<Category, 'name'>;
  images?: Pick<ListingImage, 'url'>[];
  _count: { views: number; favourites: number };
};

export class ListingMapper {
  static toShortListingSummary(listing: MappableListing): ShortListingSummaryDto {
    return {
      id: listing.id,
      title: listing.title,
      category: listing.category.name,
      price: listing.price,
      viewsCount: listing._count.views,
      likesCount: listing._count.favourites,
      created_at: formatTimeAgo(listing.created_at),
      imageUrl: listing.images && listing.images.length > 0 ? listing.images[0].url : '',
      location: listing.location,
    };
  }
}
